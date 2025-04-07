const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const questionsRoutes = require('./questions');
const { router: coinsRoutes } = require('./coins');
const { PORT, JWT_SECRET } = require('./config');
const { createQuestionsTable, createUsersTable, createTransactionsTable, db, initDatabase, addSampleQuestions } = require('./database');
const { spawn } = require('child_process');
const path = require('path');
const gameLogic = require('./gameLogic');
const { router: authRouter } = require('./routes/auth');
const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');
const gameRoutes = require('./routes/game');
const photonWebhook = require('./photon-webhook');
const { Server } = require('socket.io');
const { setupSocketIO } = require('./socketio');
const { generateQuestions: scheduleGenerateQuestions, resetQuestionWeights } = require('./scripts/scheduledTasks');

// 加载环境变量
dotenv.config();

const app = express();

// CORS 配置应该在所有路由之前
app.use(cors({
  // 允许所有来源，或者使用环境变量配置
  origin: process.env.NODE_ENV === 'production' 
    ? [
        "https://v0-retro-pixel-blog-7isprq.vercel.app",
        "https://kzmfrtoplm4ymdjxjxbb.lite.vusercontent.net",
        "http://localhost:3000",
        "http://192.168.1.xxx:3000" // 添加您电脑的实际IP
      ] 
    : '*', // 开发环境允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Cache-Control', 
    'X-Requested-With',
    'pragma',
    'expires',
    'ngrok-skip-browser-warning'
  ]
}));

// 然后是其他中间件
app.use(bodyParser.json());

app.use('/api/questions', questionsRoutes);
app.use('/api/coins', coinsRoutes);
app.use('/api/auth', authRouter);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/photon', photonWebhook);

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 创建数据库表
// 修改这里，移除直接调用，改为在 startServer 函数中调用
// createQuestionsTable();
// createUsersTable();
// createTransactionsTable();

// 创建房间API
app.post('/api/rooms', express.json(), (req, res) => {
  const { roomName, createdBy, options } = req.body;
  
  if (!roomName) {
    return res.status(400).json({ error: '房间名称不能为空' });
  }
  
  try {
    // 假设gameLogic模块中有createRoom函数
    const result = gameLogic.createRoom(roomName, createdBy, options);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('创建房间失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 添加一个端点来查看所有房间
app.get('/api/rooms/debug', (req, res) => {
  try {
    const allRooms = gameLogic.listAllRooms();
    res.json({ success: true, rooms: allRooms });
  } catch (error) {
    console.error('获取房间列表失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 添加一个临时调试路由
app.get('/api/debug/rooms', (req, res) => {
  try {
    const allRooms = gameLogic.getRooms();
    const roomCount = Object.keys(allRooms).length;
    res.json({ 
      success: true, 
      message: `找到 ${roomCount} 个房间`,
      rooms: Object.values(allRooms).map(room => ({
        id: room.id,
        name: room.name,
        players: room.players.length,
        status: room.status
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加一个临时调试路由
app.get('/api/debug/socket-status', (req, res) => {
  const io = req.app.get('io');
  try {
    const connectedSockets = Object.keys(io.sockets.sockets).length;
    const roomCount = Object.keys(gameLogic.getRooms()).length;
    res.json({ 
      success: true, 
      connectedSockets,
      roomCount,
      socketDetails: Object.keys(io.sockets.sockets).map(id => ({
        id,
        handshake: io.sockets.sockets[id].handshake.address
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加根路径处理程序
app.get('/api', (req, res) => {
  res.json({ message: 'API is working' });
});

// 创建 HTTP 服务器
const server = http.createServer(app);

// 创建 Socket.IO 实例
const io = require('socket.io')(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://172.20.10.3:3000'], // 明确指定允许的域名
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 设置 Socket.IO
setupSocketIO(io);

// 初始化数据库并启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    
    // 初始化游戏房间
    console.log('正在初始化游戏房间...');
    gameLogic.initRooms();
    console.log('游戏房间初始化完成');
    
    // 创建所有表并添加示例问题
    try {
      await createQuestionsTable();
      
      // 检查函数是否存在
      if (typeof createUsersTable === 'function') {
        await createUsersTable();
      } else {
        console.error('警告: createUsersTable 函数未在 database.js 中定义或导出');
      }
      
      if (typeof createTransactionsTable === 'function') {
        await createTransactionsTable();
      } else {
        console.error('警告: createTransactionsTable 函数未在 database.js 中定义或导出');
      }
      
      await addSampleQuestions();
    } catch (error) {
      console.error('创建数据库表失败，但继续启动服务器:', error);
    }
    
    // 启动服务器
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`HTTP Server is running on port ${PORT}`);
      
      // 不再自动生成题目
      console.log('服务器启动成功，使用预定义题库');
      
      // 不再设置定时生成题目任务
      
      // 每周一凌晨4点重置题目权重
      setInterval(() => {
        const now = new Date();
        if (now.getDay() === 1 && now.getHours() === 4 && now.getMinutes() < 5) { // 周一4:00-4:05之间执行
          console.log('执行重置题目权重任务...');
          resetQuestionWeights().catch(err => console.error('重置题目权重失败:', err));
        }
      }, 5 * 60 * 1000); // 每5分钟检查一次
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 手动生成新题目
function manualGenerateQuestions(topic, difficulty, count) {
  const scriptPath = path.join(__dirname, 'scripts', 'generateQuestions.js');
  
  console.log(`启动生成脚本: ${scriptPath}`);
  console.log(`参数: --count ${count} --difficulty ${difficulty} --topic ${topic}`);
  
  const process = spawn('node', [
    scriptPath,
    '--count', count.toString(),
    '--difficulty', difficulty,
    '--topic', topic
  ]);
  
  process.stdout.on('data', (data) => {
    console.log(`题目生成输出: ${data}`);
  });
  
  process.stderr.on('data', (data) => {
    console.error(`题目生成错误: ${data}`);
  });
  
  process.on('close', (code) => {
    console.log(`题目生成进程退出，退出码 ${code}`);
  });
}

// 检查并生成问题的函数
function checkAndGenerateQuestions() {
  // 不再自动生成题目
  console.log('题库检查：使用预定义题库，不再自动生成');
}

// 生成问题的函数
function generateQuestion() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'scripts', 'generateQuestions.js');
    console.log('脚本路径:', scriptPath);
    
    const child = spawn('node', [scriptPath, '--count', '1', '--testMode', 'true']);
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`生成脚本输出: ${data}`);
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`生成脚本错误: ${data}`);
    });
    
    child.on('close', (code) => {
      console.log(`生成脚本退出，代码: ${code}`);
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        reject({ success: false, error: errorOutput });
      }
    });
  });
}

// 导出启动和关闭服务器的函数
module.exports = {
  app,
  start: (port = PORT) => {
    if (!server) {
      server = http.createServer(app);
      server.listen(port, '0.0.0.0');
    }
    return server;
  },
  close: () => {
    if (server) {
      server.close();
      server = null;
    }
  }
};