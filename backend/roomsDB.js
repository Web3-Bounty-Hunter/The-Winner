const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { DB_PATH } = require('./config');
const { promisify } = require('util');

// 显示实际使用的数据库路径
console.log(`roomsDB 使用数据库路径: ${DB_PATH}`);

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH);

// 将数据库操作转换为 Promise
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// 创建房间表
async function createRoomsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      status TEXT DEFAULT 'waiting',
      game_type TEXT DEFAULT 'quiz',
      is_private INTEGER DEFAULT 0,
      password TEXT,
      max_players INTEGER DEFAULT 10,
      options TEXT,
      created_at INTEGER,
      start_time INTEGER,
      end_time INTEGER
    )
  `;
  
  try {
    await runAsync(sql);
    console.log('房间表创建成功或已存在');
    return true;
  } catch (error) {
    console.error('创建房间表失败:', error);
    throw error;
  }
}

// 创建房间玩家关系表
async function createRoomPlayersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS room_players (
      room_id TEXT,
      player_id TEXT,
      score INTEGER DEFAULT 0,
      joined_at INTEGER,
      PRIMARY KEY (room_id, player_id),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    )
  `;
  
  try {
    await runAsync(sql);
    console.log('房间玩家表创建成功或已存在');
  } catch (error) {
    console.error('创建房间玩家表失败:', error);
    throw error;
  }
}

// 保存房间到数据库
async function saveRoom(room) {
  // 将对象转换为 JSON 字符串
  const optionsJson = JSON.stringify(room.options || {});
  
  const sql = `
    INSERT OR REPLACE INTO rooms (
      id, name, host, status, game_type, is_private, 
      password, max_players, options, created_at, 
      start_time, end_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    room.id,
    room.name,
    room.host,
    room.status,
    room.gameType || 'quiz',
    room.isPrivate ? 1 : 0,
    room.password,
    room.maxPlayers || 10,
    optionsJson,
    room.createdAt || Date.now(),
    room.startTime,
    room.endTime
  ];
  
  try {
    await runAsync(sql, params);
    console.log(`房间 ${room.id} 已保存到数据库`);
    return true;
  } catch (error) {
    console.error(`保存房间 ${room.id} 失败:`, error);
    throw error;
  }
}

// 保存玩家到房间
async function savePlayerToRoom(roomId, playerId, score = 0) {
  const sql = `
    INSERT OR REPLACE INTO room_players
    (room_id, player_id, score, joined_at)
    VALUES (?, ?, ?, ?)
  `;
  
  try {
    await runAsync(sql, [
      roomId,
      playerId,
      score,
      Date.now()
    ]);
    
    console.log(`玩家 ${playerId} 已添加到房间 ${roomId}`);
    return true;
  } catch (error) {
    console.error('保存玩家到房间失败:', error);
    throw error;
  }
}

// 从房间移除玩家
async function removePlayerFromRoom(roomId, playerId) {
  const sql = `
    DELETE FROM room_players
    WHERE room_id = ? AND player_id = ?
  `;
  
  try {
    await runAsync(sql, [roomId, playerId]);
    console.log(`玩家 ${playerId} 已从房间 ${roomId} 移除`);
    return true;
  } catch (error) {
    console.error('从房间移除玩家失败:', error);
    throw error;
  }
}

// 更新玩家分数
async function updatePlayerScore(roomId, playerId, score) {
  const sql = `
    UPDATE room_players
    SET score = ?
    WHERE room_id = ? AND player_id = ?
  `;
  
  try {
    await runAsync(sql, [score, roomId, playerId]);
    console.log(`玩家 ${playerId} 在房间 ${roomId} 的分数已更新为 ${score}`);
    return true;
  } catch (error) {
    console.error('更新玩家分数失败:', error);
    throw error;
  }
}

// 加载所有房间
async function loadAllRooms() {
  const sql = `
    SELECT * FROM rooms
    WHERE status = 'waiting' OR status = 'idle' OR status = 'playing'
  `;
  
  try {
    const rows = await allAsync(sql);
    
    // 转换数据格式
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      host: row.host,
      status: row.status,
      gameType: row.game_type,
      isPrivate: row.is_private === 1,
      password: row.password,
      maxPlayers: row.max_players,
      options: JSON.parse(row.options || '{}'),
      createdAt: row.created_at,
      startTime: row.start_time,
      endTime: row.end_time
    }));
  } catch (error) {
    console.error('加载房间失败:', error);
    throw error;
  }
}

// 加载特定房间
async function loadRoom(roomId) {
  const sql = `
    SELECT * FROM rooms
    WHERE id = ?
  `;
  
  try {
    const row = await getAsync(sql, [roomId]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      host: row.host,
      status: row.status,
      isPrivate: row.is_private === 1,
      password: row.password,
      maxPlayers: row.max_players,
      options: JSON.parse(row.options || '{}'),
      createdAt: row.created_at,
      startTime: row.start_time,
      endTime: row.end_time
    };
  } catch (error) {
    console.error(`加载房间 ${roomId} 失败:`, error);
    throw error;
  }
}

// 加载房间玩家
async function loadRoomPlayers(roomId) {
  const sql = `
    SELECT * FROM room_players
    WHERE room_id = ?
  `;
  
  try {
    const rows = await allAsync(sql, [roomId]);
    
    // 提取玩家ID和分数
    const players = rows.map(row => row.player_id);
    const scores = rows.reduce((acc, row) => {
      acc[row.player_id] = row.score;
      return acc;
    }, {});
    
    return { players, scores };
  } catch (error) {
    console.error(`加载房间 ${roomId} 的玩家失败:`, error);
    throw error;
  }
}

// 删除房间
async function deleteRoom(roomId) {
  const sql = `
    DELETE FROM rooms
    WHERE id = ?
  `;
  
  try {
    await runAsync(sql, [roomId]);
    console.log(`房间 ${roomId} 已删除`);
    return true;
  } catch (error) {
    console.error(`删除房间 ${roomId} 失败:`, error);
    throw error;
  }
}

// 清理过期房间
async function cleanupExpiredRooms(hoursOld = 24) {
  const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);
  
  const sql = `
    DELETE FROM rooms
    WHERE created_at < ?
  `;
  
  try {
    const result = await runAsync(sql, [cutoffTime]);
    console.log(`已清理 ${result.changes} 个过期房间`);
    return result.changes;
  } catch (error) {
    console.error('清理过期房间失败:', error);
    throw error;
  }
}

module.exports = {
  createRoomsTable,
  createRoomPlayersTable,
  saveRoom,
  savePlayerToRoom,
  removePlayerFromRoom,
  updatePlayerScore,
  loadAllRooms,
  loadRoom,
  loadRoomPlayers,
  deleteRoom,
  cleanupExpiredRooms
}; 