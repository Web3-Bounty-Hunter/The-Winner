const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const util = require('util');

// 加载环境变量
dotenv.config();

// 使用绝对路径
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
console.log('数据库绝对路径:', dbPath);

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
let db = null;

try {
  db = new sqlite3.Database(dbPath);
  console.log(`SQLite 数据库连接成功: ${dbPath}`);
  
  // 检查数据库是否可读写
  db.exec('PRAGMA quick_check', (err) => {
    if (err) {
      console.error('数据库完整性检查失败:', err.message);
    } else {
      console.log('数据库完整性检查通过');
    }
  });
} catch (error) {
  console.error('创建数据库连接失败:', error);
  process.exit(1);
}

// Promise 化 db 方法
db.runAsync = util.promisify(db.run.bind(db));
db.getAsync = util.promisify(db.get.bind(db));
db.allAsync = util.promisify(db.all.bind(db));
db.execAsync = util.promisify(db.exec.bind(db));

// 初始化数据库
async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 确保数据库连接正确
    if (!db) {
      console.error('数据库连接未建立');
      return false;
    }
    
    // 启用外键约束
    await db.runAsync('PRAGMA foreign_keys = ON');
    
    // 创建用户表
    console.log('创建用户表...');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        display_name TEXT,
        coins INTEGER DEFAULT 1000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT (datetime('now','localtime'))
      )
    `);
    
    // 创建房间表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        host INTEGER NOT NULL,
        max_players INTEGER DEFAULT 6,
        is_private INTEGER DEFAULT 0,
        password TEXT,
        status TEXT DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        options TEXT,
        FOREIGN KEY (host) REFERENCES users(id)
      )
    `);
    
    // 创建房间玩家表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS room_players (
        room_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, user_id),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // 创建游戏记录表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        game_type TEXT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        data TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      )
    `);
    
    // 创建交易记录表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // 创建问题表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        options TEXT,
        correct_answer TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('数据库表初始化成功');
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return false;
  }
}

// 用户相关函数
async function getUserByUsername(username) {
  try {
    console.log(`查询用户名: ${username}`);
    
    // 确保数据库连接正常
    if (!db) {
      console.error('数据库连接未建立');
      return null;
    }
    
    // 检查用户表是否存在
    const tableExists = await db.getAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    );
    
    if (!tableExists) {
      console.error('用户表不存在');
      return null;
    }
    
    // 查询用户
    const user = await db.getAsync('SELECT * FROM users WHERE username = ?', [username]);
    
    console.log(`查询结果: ${user ? '找到用户' : '未找到用户'}`);
    
    return user;
  } catch (error) {
    console.error(`查询用户 ${username} 失败:`, error);
    return null;
  }
}

async function getUserById(id) {
  return await db.get('SELECT * FROM users WHERE id = ?', [id]);
}

async function createUser(userData) {
  const { username, password, displayName } = userData;
  
  try {
    const result = await db.run(
      'INSERT INTO users (username, password, display_name, coins) VALUES (?, ?, ?, ?)',
      [username, password, displayName || username, 1000]
    );
    
    return {
      success: true,
      userId: result.lastID
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function updateUserCoins(userId, amount, description) {
  try {
    // 开始事务
    await db.run('BEGIN TRANSACTION');
    
    // 更新用户金币
    await db.run(
      'UPDATE users SET coins = coins + ? WHERE id = ?',
      [amount, userId]
    );
    
    // 记录交易
    await db.run(
      'INSERT INTO transactions (user_id, amount, description) VALUES (?, ?, ?)',
      [userId, amount, description]
    );
    
    // 提交事务
    await db.run('COMMIT');
    
    return { success: true };
  } catch (error) {
    // 回滚事务
    await db.run('ROLLBACK');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// 房间相关函数
async function createRoomInDB(roomData) {
  const { name, host, maxPlayers, isPrivate, password, options } = roomData;
  
  // 生成随机房间ID (6位字母数字)
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  try {
    // 开始事务
    await db.run('BEGIN TRANSACTION');
    
    // 创建房间
    await db.run(
      `INSERT INTO rooms (id, name, host, max_players, is_private, password, options)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        roomId,
        name,
        host,
        maxPlayers,
        isPrivate ? 1 : 0,
        password,
        JSON.stringify(options)
      ]
    );
    
    // 将房主添加到房间玩家列表
    await db.run(
      'INSERT INTO room_players (room_id, user_id) VALUES (?, ?)',
      [roomId, host]
    );
    
    // 提交事务
    await db.run('COMMIT');
    
    return {
      success: true,
      roomId
    };
  } catch (error) {
    // 回滚事务
    await db.run('ROLLBACK');
    
    return {
      success: false,
      error: error.message
    };
  }
}

async function getRoomFromDB(roomId) {
  try {
    // 获取房间基本信息
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    
    if (!room) {
      return null;
    }
    
    // 解析选项
    room.options = JSON.parse(room.options);
    
    // 获取房间玩家
    const players = await db.all(
      `SELECT u.id, u.username, u.display_name, u.coins
       FROM room_players rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.room_id = ?`,
      [roomId]
    );
    
    room.players = players;
    
    return room;
  } catch (error) {
    console.error(`获取房间 ${roomId} 失败:`, error);
    return null;
  }
}

async function getAllRoomsFromDB() {
  try {
    // 获取所有房间
    const rooms = await db.all('SELECT * FROM rooms');
    
    // 处理每个房间
    for (const room of rooms) {
      // 解析选项
      room.options = JSON.parse(room.options);
      
      // 获取房间玩家
      const players = await db.all(
        `SELECT u.id, u.username, u.display_name, u.coins
         FROM room_players rp
         JOIN users u ON rp.user_id = u.id
         WHERE rp.room_id = ?`,
        [room.id]
      );
      
      room.players = players;
    }
    
    return rooms;
  } catch (error) {
    console.error('获取所有房间失败:', error);
    return [];
  }
}

async function addPlayerToRoomInDB(roomId, userId) {
  try {
    await db.run(
      'INSERT INTO room_players (room_id, user_id) VALUES (?, ?)',
      [roomId, userId]
    );
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function removePlayerFromRoomInDB(roomId, userId) {
  try {
    await db.run(
      'DELETE FROM room_players WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function updateRoomStatusInDB(roomId, status) {
  try {
    await db.run(
      'UPDATE rooms SET status = ? WHERE id = ?',
      [status, roomId]
    );
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 游戏相关函数
async function storeGameDataInDB(roomId, gameData) {
  try {
    const result = await db.run(
      'INSERT INTO games (room_id, game_type, data) VALUES (?, ?, ?)',
      [roomId, 'poker', JSON.stringify(gameData)]
    );
    
    return {
      success: true,
      gameId: result.lastID
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function getGameDataFromDB(roomId) {
  try {
    const game = await db.get(
      'SELECT * FROM games WHERE room_id = ? ORDER BY id DESC LIMIT 1',
      [roomId]
    );
    
    if (!game) {
      return null;
    }
    
    // 解析游戏数据
    game.data = JSON.parse(game.data);
    
    return game.data;
  } catch (error) {
    console.error(`获取房间 ${roomId} 的游戏数据失败:`, error);
    return null;
  }
}

async function updateGameDataInDB(roomId, gameData) {
  try {
    await db.run(
      `UPDATE games SET data = ? 
       WHERE room_id = ? AND id = (
         SELECT id FROM games WHERE room_id = ? ORDER BY id DESC LIMIT 1
       )`,
      [JSON.stringify(gameData), roomId, roomId]
    );
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function recordGameResult(roomId, gameType, results) {
  try {
    // 获取当前游戏
    const game = await db.get(
      'SELECT * FROM games WHERE room_id = ? ORDER BY id DESC LIMIT 1',
      [roomId]
    );
    
    if (!game) {
      return {
        success: false,
        error: '游戏不存在'
      };
    }
    
    // 更新游戏结束时间和结果
    await db.run(
      'UPDATE games SET end_time = datetime("now"), data = ? WHERE id = ?',
      [JSON.stringify({ ...JSON.parse(game.data), results }), game.id]
    );
    
    return {
      success: true,
      gameId: game.id
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 添加问题相关函数
async function createQuestionsTable() {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        options TEXT,
        correct_answer TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('问题表创建成功');
    return true;
  } catch (error) {
    console.error('创建问题表失败:', error);
    return false;
  }
}

async function addQuestion(question) {
  const { content, options, correctAnswer, difficulty, category } = question;
  
  try {
    await db.runAsync(
      'INSERT INTO questions (content, options, correct_answer, difficulty, category) VALUES (?, ?, ?, ?, ?)',
      [
        content,
        JSON.stringify(options),
        correctAnswer,
        difficulty,
        category
      ]
    );
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function getQuestionsByDifficulty(difficulty) {
  try {
    const questions = await db.allAsync(
      'SELECT * FROM questions WHERE difficulty = ?',
      [difficulty]
    );
    
    // 解析选项
    return questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));
  } catch (error) {
    console.error(`获取难度为 ${difficulty} 的问题失败:`, error);
    return [];
  }
}

async function getRandomQuestion(difficulty) {
  try {
    const question = await db.getAsync(
      'SELECT * FROM questions WHERE difficulty = ? ORDER BY RANDOM() LIMIT 1',
      [difficulty]
    );
    
    if (!question) {
      return null;
    }
    
    // 解析选项
    return {
      ...question,
      options: JSON.parse(question.options)
    };
  } catch (error) {
    console.error(`获取随机问题失败:`, error);
    return null;
  }
}

// 添加示例问题
async function addSampleQuestions() {
  const sampleQuestions = [
    {
      content: '比特币的创始人是谁?',
      options: ['中本聪', '维塔利克·布特林', '查尔斯·霍斯金森', '比尔·盖茨'],
      correctAnswer: '中本聪',
      difficulty: 'easy',
      category: 'blockchain'
    },
    {
      content: '以太坊使用的共识机制是什么?',
      options: ['工作量证明(PoW)', '权益证明(PoS)', '授权证明(DPoS)', '容量证明(PoC)'],
      correctAnswer: '权益证明(PoS)',
      difficulty: 'medium',
      category: 'blockchain'
    },
    {
      content: '下面哪个不是比特币的特点?',
      options: ['去中心化', '匿名性', '可逆交易', '有限供应'],
      correctAnswer: '可逆交易',
      difficulty: 'easy',
      category: 'blockchain'
    },
    {
      content: '智能合约主要应用于哪个区块链平台?',
      options: ['比特币', '以太坊', '瑞波币', '莱特币'],
      correctAnswer: '以太坊',
      difficulty: 'easy',
      category: 'blockchain'
    },
    {
      content: '区块链中的"51%攻击"是指什么?',
      options: [
        '单个实体控制超过51%的网络算力',
        '51%的节点被黑客攻击',
        '区块链被分叉成51个子链',
        '交易费用上涨51%'
      ],
      correctAnswer: '单个实体控制超过51%的网络算力',
      difficulty: 'medium',
      category: 'blockchain'
    },
    {
      content: '以下哪种加密货币不使用区块链技术?',
      options: ['IOTA', '比特币', '以太坊', '莱特币'],
      correctAnswer: 'IOTA',
      difficulty: 'hard',
      category: 'blockchain'
    },
    {
      content: 'ERC-20是什么标准?',
      options: [
        '以太坊代币标准',
        '比特币交易标准',
        '区块链安全协议',
        '跨链通信协议'
      ],
      correctAnswer: '以太坊代币标准',
      difficulty: 'medium',
      category: 'blockchain'
    },
    {
      content: '区块链的哪个特性确保了交易不可篡改?',
      options: ['共识机制', '密码学哈希', '分布式账本', '智能合约'],
      correctAnswer: '密码学哈希',
      difficulty: 'hard',
      category: 'blockchain'
    },
    {
      content: '比特币网络平均多长时间生成一个新区块?',
      options: ['1分钟', '10分钟', '1小时', '1天'],
      correctAnswer: '10分钟',
      difficulty: 'easy',
      category: 'blockchain'
    },
    {
      content: '以下哪个不是区块链可能的应用领域?',
      options: ['供应链管理', '医疗记录', '投票系统', '时间旅行'],
      correctAnswer: '时间旅行',
      difficulty: 'easy',
      category: 'blockchain'
    },
    {
      content: '什么是"冷钱包"?',
      options: [
        '存储加密货币的离线钱包',
        '交易量很小的钱包',
        '被冻结的加密货币账户',
        '专门用于小额支付的钱包'
      ],
      correctAnswer: '存储加密货币的离线钱包',
      difficulty: 'medium',
      category: 'blockchain'
    },
    {
      content: '比特币的总供应量上限是多少?',
      options: ['1000万', '2100万', '1亿', '无限'],
      correctAnswer: '2100万',
      difficulty: 'easy',
      category: 'blockchain'
    },
    {
      content: '区块链中的"挖矿"主要是指什么过程?',
      options: [
        '创建新的加密货币',
        '验证交易并将其添加到区块链中',
        '黑客攻击区块链网络',
        '将法定货币兑换成加密货币'
      ],
      correctAnswer: '验证交易并将其添加到区块链中',
      difficulty: 'medium',
      category: 'blockchain'
    },
    {
      content: '以下哪个是第一个实现零知识证明的加密货币?',
      options: ['比特币', '以太坊', 'Zcash', '门罗币'],
      correctAnswer: 'Zcash',
      difficulty: 'hard',
      category: 'blockchain'
    },
    {
      content: '区块链技术最初是为了解决什么问题而设计的?',
      options: [
        '数字货币的双重支付问题',
        '互联网隐私问题',
        '银行间转账速度慢的问题',
        '政府监管问题'
      ],
      correctAnswer: '数字货币的双重支付问题',
      difficulty: 'medium',
      category: 'blockchain'
    }
  ];
  
  for (const question of sampleQuestions) {
    await addQuestion(question);
  }
  
  console.log('示例问题添加成功');
  return true;
}

// 创建用户表
async function createUsersTable() {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        display_name TEXT,
        coins INTEGER DEFAULT 1000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT (datetime('now','localtime'))
      )
    `);
    
    console.log('用户表创建成功');
    return true;
  } catch (error) {
    console.error('创建用户表失败:', error);
    return false;
  }
}

// 创建交易记录表
async function createTransactionsTable() {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    console.log('交易记录表创建成功');
    return true;
  } catch (error) {
    console.error('创建交易记录表失败:', error);
    return false;
  }
}

// 检查题库库存
async function checkQuestionInventory() {
  try {
    // 获取每个难度级别的问题数量
    const inventory = {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0
    };
    
    // 查询每个难度级别的问题数量
    const counts = await db.allAsync(
      'SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty'
    );
    
    // 填充库存对象
    counts.forEach(item => {
      if (item.difficulty in inventory) {
        inventory[item.difficulty] = item.count;
        inventory.total += item.count;
      }
    });
    
    return inventory;
  } catch (error) {
    console.error('检查题库库存失败:', error);
    throw error;
  }
}

// 关闭数据库连接
process.on('SIGINT', () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});

// 导出函数
module.exports = {
  initDatabase,
  getUserByUsername,
  getUserById,
  createUser,
  updateUserCoins,
  createRoomInDB,
  getRoomFromDB,
  getAllRoomsFromDB,
  addPlayerToRoomInDB,
  removePlayerFromRoomInDB,
  updateRoomStatusInDB,
  storeGameDataInDB,
  getGameDataFromDB,
  updateGameDataInDB,
  recordGameResult,
  createQuestionsTable,
  createUsersTable,
  createTransactionsTable,
  addQuestion,
  getQuestionsByDifficulty,
  getRandomQuestion,
  addSampleQuestions,
  checkQuestionInventory
};