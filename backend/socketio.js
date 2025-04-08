const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');
const { getUserById } = require('./database');
const gameLogic = require('./gameLogic');

// 存储房间和玩家信息
const rooms = {};
const players = {};
const clients = {};

// 添加节流变量和函数
const throttle = {
  getRooms: { lastTime: 0, interval: 1000 },
};

function shouldThrottle(operation) {
  const now = Date.now();
  if (now - throttle[operation].lastTime < throttle[operation].interval) {
    return true;
  }
  throttle[operation].lastTime = now;
  return false;
}

// 清理房间数据（移除敏感信息）
function sanitizeRoomData(room) {
  if (!room) return null;
  
  const sanitizedRoom = { ...room };
  
  // 移除密码
  delete sanitizedRoom.password;
  
  // 如果有题目，移除答案
  if (sanitizedRoom.questions && sanitizedRoom.questions.length > 0) {
    sanitizedRoom.questions = sanitizedRoom.questions.map(q => {
      const { correctAnswer, explanation, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });
  }
  
  return sanitizedRoom;
}

// 只在以下情况发送roomListUpdated事件:
// 1. 创建新房间
// 2. 房间被删除
// 3. 房间状态变化(如开始游戏、结束游戏)

// 减少roomListUpdated事件广播
const roomListUpdateThrottle = { lastUpdate: 0, minInterval: 3000 };

function broadcastRoomListUpdate(io) {
  const now = Date.now();
  // 限制广播频率为至少3秒一次
  if (now - roomListUpdateThrottle.lastUpdate < roomListUpdateThrottle.minInterval) {
    console.log('忽略过于频繁的房间列表更新广播');
    return;
  }
  
  roomListUpdateThrottle.lastUpdate = now;
  console.log('广播房间列表更新通知');
  io.emit('roomListUpdated');
}

// 设置 Socket.IO
function setupSocketIO(io) {
  console.log('设置 Socket.IO...');
  
  // 中间件：认证用户
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        // 无令牌也允许连接，但不会认证
        socket.userId = null;
        return next();
      }
      
      // 验证令牌
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded && decoded.id) {
        // 获取用户信息
        const user = await getUserById(decoded.id);
        
        if (user) {
          // 设置用户ID到socket
          socket.userId = decoded.id;
          console.log(`用户 ${decoded.id} 已认证`);
        }
      }
      
      next();
    } catch (error) {
      console.error('认证错误:', error);
      next();
    }
  });

  // 监听连接
  io.on('connection', (socket) => {
    console.log('新连接:', socket.id);
    
    // 生成玩家ID
    const playerId = socket.userId || `guest-${uuidv4()}`;
    
    // 如果是已认证用户，确保有玩家记录
    if (socket.userId) {
      if (!players[socket.userId]) {
        players[socket.userId] = {
          id: socket.userId,
          sessions: {},
          isAuthenticated: true
        };
      }
      
      // 添加当前会话
      players[socket.userId].sessions[socket.id] = {
        connected: true,
        lastActivity: Date.now()
      };
    } else {
      // 未认证用户
      players[playerId] = {
        id: playerId,
        sessions: {
          [socket.id]: {
            connected: true,
            lastActivity: Date.now()
          }
        },
        isAuthenticated: false
      };
    }
    
    // 存储客户端引用
    clients[socket.id] = socket;
    
    // 发送连接确认
    socket.emit('connected', {
      playerId,
      isAuthenticated: !!socket.userId
    });
    
    // 如果已认证，发送认证成功信息
    if (socket.userId) {
      socket.emit('authenticated', {
        userId: socket.userId
      });
    }
    
    // 设置 ping/pong 保持连接
    const pingInterval = setInterval(() => {
      socket.emit('ping', { time: Date.now() });
    }, 30000);
    
    // 处理 pong 响应
    socket.on('pong', (data) => {
      const id = socket.userId || playerId;
      if (players[id] && players[id].sessions[socket.id]) {
        players[id].sessions[socket.id].lastActivity = Date.now();
      }
    });
    
    // 处理获取房间列表
    socket.on('getRooms', (data) => {
      // 应用节流逻辑
      if (shouldThrottle('getRooms')) {
        return; // 忽略频繁请求
      }
      try {
        // 减少日志频率
        if (Math.random() < 0.1) { // 只记录约10%的请求
          console.log(`用户 ${socket.id} 请求获取房间列表，过滤条件: ${data.filter || 'all'}`);
        }
        
        // 获取房间列表
        console.log("调用 gameLogic.getRooms()");
        const allRooms = gameLogic.getRooms();
        console.log("获取到的房间对象:", JSON.stringify(allRooms, null, 2));
        const roomList = Object.values(allRooms).map(room => sanitizeRoomData(room));
        
        // 简化日志输出
        console.log(`发送 roomList 事件，包含 ${roomList.length} 个房间`);
        
        // 根据过滤条件筛选
        let filteredRooms = roomList;
        if (data && data.filter && data.filter !== 'all') {
          // 添加过滤逻辑
          // ...
        }
        
        socket.emit('roomList', { rooms: filteredRooms });
      } catch (error) {
        console.error('处理获取房间列表失败:', error.stack || error);
        socket.emit('error', { message: `获取房间列表失败: ${error.message}` });
      }
    });
    
    // 处理创建房间
    socket.on('createRoom', (data) => {
      // 添加防止重复处理的简单锁定机制
      if (socket.processingCreateRoom) {
        console.log('忽略重复的创建房间请求');
        return;
      }
      
      socket.processingCreateRoom = true;
      
      try {
        console.log(`用户 ${socket.id} 请求创建房间:`, data);
        const userId = socket.userId || playerId;
        console.log(`用户 ${userId} (Socket ID: ${socket.id}) 正在创建房间，数据:`, JSON.stringify(data, null, 2));
        
        // 确保 players[userId] 存在
        if (!players[userId]) {
          console.log(`创建玩家记录: ${userId}`);
          players[userId] = {
            id: userId,
            sessions: {},
            isAuthenticated: !!socket.userId
          };
        }
        
        // 创建房间
        console.log("调用 gameLogic.createRoom 前的参数:", JSON.stringify({
          ...data,
          host: userId
        }, null, 2));
        
        const result = gameLogic.createRoom({
          ...data,
          host: userId
        });
        
        console.log("创建房间结果:", JSON.stringify(result, null, 2));
        
        if (result.success) {
          const roomId = result.room.id;
          
          // 加入 socket.io 房间
          socket.join(roomId);
          
          // 更新玩家状态
          if (!players[userId]) {
            console.error(`玩家 ${userId} 不存在，无法更新房间ID`);
            socket.emit('error', { message: '创建房间失败: 玩家记录不存在' });
            return;
          }
          
          players[userId].roomId = roomId;
          
          // 准备发送给客户端的数据
          const responseData = {
            success: true,
            roomId: roomId,
            room: sanitizeRoomData(result.room)
          };
          console.log("准备发送 room_created 事件，数据:", JSON.stringify(responseData, null, 2));
          
          // 发送成功消息
          socket.emit('room_created', responseData);
          
          // 检查 socket 是否仍然连接
          console.log(`Socket ${socket.id} 连接状态:`, socket.connected);
          
          console.log(`房间 ${roomId} 创建成功，已发送 room_created 事件`);
          
          // 广播房间列表更新
          broadcastRoomListUpdate(io);
          
          // 在发送响应后重置处理标志
          setTimeout(() => {
            socket.processingCreateRoom = false;
          }, 100);
        } else {
          console.error(`创建房间失败: ${result.error}`);
          socket.emit('error', { message: `创建房间失败: ${result.error}` });
          
          // 出错时也重置处理标志
          socket.processingCreateRoom = false;
        }
      } catch (error) {
        console.error('处理创建房间失败:', error.stack || error);
        socket.emit('error', { message: `创建房间失败: ${error.message}` });
        
        // 出错时也重置处理标志
        socket.processingCreateRoom = false;
      }
    });
    
    // 处理加入房间
    socket.on('joinRoom', (data) => {
      try {
        const userId = socket.userId || playerId;
        const { roomId } = data || {};
        
        console.log(`用户 ${userId} 尝试加入房间 ${roomId}`);
        // 确保 getRooms() 函数存在并正确使用
        const availableRooms = gameLogic.getRooms ? Object.keys(gameLogic.getRooms()) : [];
        console.log('当前可用房间:', availableRooms);
        
        if (!roomId) {
          socket.emit('error', { message: '加入房间失败: 缺少房间ID' });
          return;
        }
        
        // 检查玩家是否已在其他房间
        if (players[userId].roomId && players[userId].roomId !== roomId) {
          // 先离开当前房间
          const leaveResult = gameLogic.leaveRoom(userId, players[userId].roomId);
          
          if (leaveResult.success) {
            // 离开之前的房间
            socket.leave(players[userId].roomId);
            
            // 广播房间更新
            io.to(players[userId].roomId).emit('roomUpdated', {
              room: sanitizeRoomData(leaveResult.room)
            });
            
            // 如果房间被删除，广播房间列表更新
            if (leaveResult.roomDeleted) {
              broadcastRoomListUpdate(io);
            }
          }
        }
        
        // 加入新房间
        const result = gameLogic.joinRoom(userId, roomId);
        
        if (result.success) {
          // 加入 socket.io 房间
          socket.join(roomId);
          
          // 更新玩家状态
          players[userId].roomId = roomId;
          
          // 发送成功消息
          socket.emit('room_joined', {
            success: true,
            room: sanitizeRoomData(result.room)
          });
          
          // 广播房间更新给所有房间内玩家
          io.to(roomId).emit('roomUpdated', {
            room: sanitizeRoomData(result.room)
          });
          
          // 广播房间列表更新
          broadcastRoomListUpdate(io);
        } else {
          socket.emit('error', { message: `加入房间失败: ${result.error}` });
        }
      } catch (error) {
        console.error('处理加入房间失败:', error);
        socket.emit('error', { message: `加入房间失败: ${error.message}` });
      }
    });
    
    // 处理离开房间
    socket.on('leaveRoom', (data) => {
      try {
        const userId = socket.userId || playerId;
        const { roomId } = data || {};
        const currentRoomId = roomId || players[userId]?.roomId;
        
        if (!currentRoomId) {
          socket.emit('error', { message: '离开房间失败: 你不在任何房间内' });
          return;
        }
        
        console.log(`用户 ${userId} 正在离开房间 ${currentRoomId}`);
        
        // 离开房间
        const result = gameLogic.leaveRoom(userId, currentRoomId);
        
        if (result.success) {
          // 离开 socket.io 房间
          socket.leave(currentRoomId);
          
          // 更新玩家状态
          delete players[userId].roomId;
          
          // 发送成功消息
          socket.emit('room_left', {
            success: true,
            roomId: currentRoomId
          });
          
          // 广播房间更新给所有房间内玩家
          io.to(currentRoomId).emit('roomUpdated', {
            room: sanitizeRoomData(result.room)
          });
          
          // 广播房间列表更新，因为房间成员发生了变化
          broadcastRoomListUpdate(io);
        } else {
          socket.emit('error', { message: `离开房间失败: ${result.error}` });
        }
      } catch (error) {
        console.error('处理离开房间失败:', error);
        socket.emit('error', { message: `离开房间失败: ${error.message}` });
      }
    });
    
    // 处理准备状态
    socket.on('ready', (data) => {
      try {
        const userId = socket.userId || playerId;
        const { ready, roomId } = data || {};
        const currentRoomId = roomId || players[userId]?.roomId;
        
        if (!currentRoomId) {
          socket.emit('error', { message: '设置准备状态失败: 你不在任何房间内' });
          return;
        }
        
        console.log(`用户 ${userId} 设置准备状态为 ${ready ? '已准备' : '未准备'} 在房间 ${currentRoomId}`);
        
        // 设置准备状态
        const result = gameLogic.setPlayerReady(userId, currentRoomId, !!ready);
        
        if (result.success) {
          // 广播房间更新给所有房间内玩家
          io.to(currentRoomId).emit('roomUpdated', {
            room: sanitizeRoomData(result.room)
          });
        } else {
          socket.emit('error', { message: `设置准备状态失败: ${result.error}` });
        }
      } catch (error) {
        console.error('处理准备状态失败:', error);
        socket.emit('error', { message: `设置准备状态失败: ${error.message}` });
      }
    });
    
    // 处理开始游戏
    socket.on('startGame', (data) => {
      try {
        const userId = socket.userId || playerId;
        const { roomId } = data || {};
        const currentRoomId = roomId || players[userId]?.roomId;
        
        if (!currentRoomId) {
          socket.emit('error', { message: '开始游戏失败: 你不在任何房间内' });
          return;
        }
        
        console.log(`用户 ${userId} 尝试开始游戏 在房间 ${currentRoomId}`);
        
        // 开始游戏
        const result = gameLogic.startGame(userId, currentRoomId);
        
        if (result.success) {
          // 广播游戏开始给所有房间内玩家
          io.to(currentRoomId).emit('gameStarted', {
            room: sanitizeRoomData(result.room),
            gameState: result.gameState
          });
          
          // 广播房间更新
          io.to(currentRoomId).emit('roomUpdated', {
            room: sanitizeRoomData(result.room)
          });
          
          // 广播房间列表更新
          broadcastRoomListUpdate(io);
        } else {
          socket.emit('error', { message: `开始游戏失败: ${result.error}` });
        }
      } catch (error) {
        console.error('处理开始游戏失败:', error);
        socket.emit('error', { message: `开始游戏失败: ${error.message}` });
      }
    });
    
    // 处理游戏动作
    socket.on('gameAction', (data) => {
      try {
        const userId = socket.userId || playerId;
        const { action, data: actionData, roomId } = data || {};
        const currentRoomId = roomId || players[userId]?.roomId;
        
        if (!currentRoomId) {
          socket.emit('error', { message: '游戏动作失败: 你不在任何游戏中' });
          return;
        }
        
        if (!action) {
          socket.emit('error', { message: '游戏动作失败: 缺少动作类型' });
          return;
        }
        
        console.log(`用户 ${userId} 执行游戏动作 ${action} 在房间 ${currentRoomId}`);
        
        // 执行游戏动作
        const result = gameLogic.handlePokerAction(userId, currentRoomId, action, actionData);
        
        if (result.success) {
          // 广播游戏更新给所有房间内玩家
          io.to(currentRoomId).emit('gameUpdate', {
            action,
            result: result.result,
            gameState: result.gameState
          });
          
          // 如果游戏结束，广播游戏结束事件
          if (result.gameEnded) {
            io.to(currentRoomId).emit('gameEnded', {
              winners: result.winners,
              scores: result.scores,
              summary: result.summary
            });
            
            // 广播房间更新
            io.to(currentRoomId).emit('roomUpdated', {
              room: sanitizeRoomData(result.room)
            });
            
            // 广播房间列表更新
            broadcastRoomListUpdate(io);
          }
        } else {
          socket.emit('error', { message: `游戏动作失败: ${result.error}` });
        }
      } catch (error) {
        console.error('处理游戏动作失败:', error);
        socket.emit('error', { message: `游戏动作失败: ${error.message}` });
      }
    });
    
    // 处理聊天消息
    socket.on('chatMessage', (data) => {
      console.log(`收到聊天消息：${data.message} 来自：${socket.userId || playerId}`);
      
      // 验证数据
      if (!data.message) {
        return socket.emit('error', { message: '消息内容不能为空' });
      }
      
      // 准备响应数据
      const messageData = {
        id: uuidv4(),
        senderId: socket.userId || playerId,
        senderName: players[socket.userId || playerId]?.name || '游客',
        message: data.message,
        timestamp: Date.now()
      };
      
      // 如果指定了房间，发送到房间
      if (data.roomId && rooms[data.roomId]) {
        io.to(data.roomId).emit('message', messageData);
      } else {
        // 否则发送回发送方
        socket.emit('message', messageData);
        
        // 可选：也可以广播给所有用户（全局聊天）
        // socket.broadcast.emit('message', messageData);
      }
    });
    
    // 处理获取房间信息
    socket.on('getRoomInfo', (data) => {
      console.log(`用户 ${socket.id} 请求获取房间 ${data.roomId} 信息`);
      
      try {
        // 获取房间信息
        let room = rooms[data.roomId];
        
        // 如果直接获取不到，尝试通过gameLogic获取
        if (!room && gameLogic && typeof gameLogic.getRoomInfo === 'function') {
          console.log(`通过gameLogic尝试获取房间 ${data.roomId}`);
          room = gameLogic.getRoomInfo(data.roomId);
        }
        
        // 添加调试输出
        console.log(`房间${data.roomId}查询结果:`, room ? '存在' : '不存在');
        if (!room) {
          console.log('当前所有房间IDs:', Object.keys(rooms));
        }
        
        if (room) {
          // 发送房间信息
          socket.emit('roomInfo', {
            room: sanitizeRoomData(room)
          });
        } else {
          socket.emit('error', { message: `房间 ${data.roomId} 不存在` });
        }
      } catch (error) {
        console.error('获取房间信息失败:', error);
        socket.emit('error', { message: '获取房间信息失败' });
      }
    });
    
    // 添加测试事件
    socket.on('test_event', (data) => {
      console.log('收到测试事件:', data);
      socket.emit('test_response', { message: '这是一个测试响应' });
    });
    
    // 添加一个手动测试事件
    socket.on('manual_get_rooms', (data) => {
      try {
        console.log('收到手动获取房间列表请求');
        const allRooms = gameLogic.getRooms();
        console.log(`找到 ${Object.keys(allRooms).length} 个房间`);
        const roomList = Object.values(allRooms).map(room => ({
          id: room.id,
          name: room.name,
          host: room.host,
          players: room.players,
          maxPlayers: room.maxPlayers,
          status: room.status,
          isPrivate: room.isPrivate
        }));
        console.log(`发送 manual_room_list 事件，包含 ${roomList.length} 个房间`);
        socket.emit('manual_room_list', { rooms: roomList });
      } catch (error) {
        console.error('手动处理房间列表失败:', error);
      }
    });
    
    // 处理断开连接
    socket.on('disconnect', (reason) => {
      console.log(`用户 ${socket.id} 断开连接: ${reason}`);
      
      // 更新玩家会话状态
      if (players[socket.userId || playerId]?.sessions[socket.id]) {
        delete players[socket.userId || playerId].sessions[socket.id];
        
        // 如果没有其他活跃会话，从房间中移除玩家
        if (Object.keys(players[socket.userId || playerId].sessions).length === 0) {
          // 获取玩家所在房间
          const roomId = players[socket.userId || playerId].roomId;
          
          if (roomId) {
            // 离开房间
            const result = gameLogic.leaveRoom(socket.userId || playerId, roomId);
            
            if (result.success) {
              // 广播房间更新
              io.to(roomId).emit('roomUpdated', {
                room: sanitizeRoomData(result.room)
              });
              
              // 如果房间被删除，广播房间列表更新
              if (result.roomDeleted) {
                broadcastRoomListUpdate(io);
              }
            }
            
            // 清除玩家房间ID
            delete players[socket.userId || playerId].roomId;
          }
          
          // 如果是临时玩家，可以删除
          if (!socket.userId) {
            delete players[playerId];
          }
        }
      }
      
      // 清除客户端引用
      delete clients[socket.id];
      
      // 清除 ping 定时器
      clearInterval(pingInterval);
    });
  });
}

module.exports = {
  setupSocketIO,
  rooms,
  players,
  clients
}; 