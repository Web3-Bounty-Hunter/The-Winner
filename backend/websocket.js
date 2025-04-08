const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const gameLogic = require('./gameLogic');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');
const { getUserById } = require('./database');
const { updateCoins } = require('./coins');

// 存储房间和玩家信息
const rooms = {};
const players = {};

// 存储客户端连接
let clients = {};

// 从 WebSocket 连接获取用户 ID
function getUserIdFromWebSocket(ws) {
  return ws.userId; // 这应该在认证时设置
}

// 发送错误消息给客户端
function sendError(ws, message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      message
    }));
  }
}

// 发送消息给客户端
function sendToClient(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// 广播房间更新
function broadcastRoomUpdate(room) {
  if (!room) {
    console.error('尝试广播空房间更新');
    return;
  }
  
  console.log(`广播房间 ${room.id} 更新，当前玩家: ${JSON.stringify(room.players)}`);
  
  // 获取房间中的所有玩家
  const roomPlayers = room.players || [];
  
  // 向所有玩家发送房间更新消息
  roomPlayers.forEach(playerId => {
    try {
      const player = players[playerId];
      if (!player) {
        console.log(`玩家 ${playerId} 不存在，无法发送房间更新`);
        return;
      }
      
      // 如果是多会话结构
      if (player.sessions) {
        Object.values(player.sessions).forEach(session => {
          if (session.ws && session.ws.readyState === WebSocket.OPEN) {
            console.log(`向玩家 ${playerId} 的会话发送房间更新`);
            sendToClient(session.ws, {
              type: 'roomUpdated',
              room: sanitizeRoomData(room)
            });
          }
        });
      } 
      // 兼容旧结构
      else if (player.ws && player.ws.readyState === WebSocket.OPEN) {
        console.log(`向玩家 ${playerId} 发送房间更新`);
        sendToClient(player.ws, {
          type: 'roomUpdated',
          room: sanitizeRoomData(room)
        });
      } else {
        console.log(`玩家 ${playerId} 的WebSocket连接无效，无法发送房间更新`);
      }
    } catch (error) {
      console.error(`向玩家 ${playerId} 发送房间更新失败:`, error);
    }
  });
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

// 广播房间列表更新
function broadcastRoomListUpdate() {
  try {
    // 获取所有房间
    const allRooms = gameLogic.getAllRooms();
    
    if (allRooms.length > 0) {
      console.log(`广播房间列表更新，共 ${allRooms.length} 个房间，当前连接客户端数: ${Object.keys(clients).length}`);
      
      // 向所有已认证的客户端广播
      Object.values(clients).forEach(client => {
        if (client.ws && client.ws.readyState === WebSocket.OPEN && client.userId) {
          console.log(`向用户 ${client.userId} 广播房间列表更新`);
          sendToClient(client.ws, {
            type: 'roomListUpdate',
            rooms: allRooms
          });
        }
      });
    }
  } catch (error) {
    console.error('广播房间列表更新失败:', error);
  }
}

// 确保玩家对象存在
function ensurePlayerExists(userId, username, ws) {
    if (!players[userId]) {
        players[userId] = {
            userId,
            username,
            ws
        };
    } else {
        // 更新 WebSocket 连接
        players[userId].ws = ws;
        if (username) {
            players[userId].username = username;
        }
    }
    return players[userId];
}

// 初始化 WebSocket 服务器
function initWebSocket(server) {
    const wss = new WebSocket.Server({ server });

  console.log('WebSocket 服务器已初始化');
  
  wss.on('connection', (ws, req) => {
    const playerId = uuidv4();
    
    console.log(`新的 WebSocket 连接: ${playerId}`);
    
    // 存储客户端连接
    clients[playerId] = { ws, playerId };
    
    // 发送连接成功消息
    sendToClient(ws, {
      type: 'connected',
      playerId
    });
    
    // 处理消息
        ws.on('message', (message) => {
      try {
        handleMessage(ws, message);
      } catch (error) {
        console.error('处理消息失败:', error);
        sendError(ws, `处理消息失败: ${error.message}`);
      }
    });
    
    // 处理连接关闭
    ws.on('close', () => {
      console.log(`WebSocket 连接关闭: ${playerId}`);
      
      // 获取用户ID
      const userId = getUserIdFromWebSocket(ws);
      
      // 如果用户在游戏中，处理离开房间
      if (userId && players[userId] && players[userId].roomId) {
        const roomId = players[userId].roomId;
        
        console.log(`用户 ${userId} 断开连接，自动离开房间 ${roomId}`);
        
        try {
          // 处理离开房间，但不删除房间
          const result = gameLogic.leaveRoom(roomId, userId);
          
          if (result.success && result.room) {
            // 广播房间更新
            broadcastRoomUpdate(result.room);
            
            // 保存玩家离开记录到数据库
            try {
              roomsDB.removePlayerFromRoom(roomId, userId);
            } catch (dbError) {
              console.error(`从数据库移除玩家 ${userId} 失败:`, dbError);
            }
          }
          
          // 清除玩家信息，但保留房间
          delete players[userId].roomId;
        } catch (error) {
          console.error(`处理用户 ${userId} 断开连接时出错:`, error);
        }
      }
      
      // 删除客户端连接
      delete clients[playerId];
    });
    
    // 处理错误
    ws.on('error', (error) => {
      console.error(`WebSocket 错误 (${playerId}):`, error);
    });

    // 在 initWebSocket 函数中添加
    ws.isAlive = true;

    // 处理 pong 消息
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });
  
  // 初始化 gameLogic 模块
  gameLogic.init({
    rooms,
    players,
    broadcast,
    sendToPlayer
  });
  
  // 设置定期广播房间列表
  setInterval(() => {
    try {
      broadcastRoomListUpdate();
    } catch (error) {
      console.error('定期广播房间列表失败:', error);
    }
  }, 30000); // 每30秒广播一次
  
  // 添加调试信息
  setInterval(() => {
    try {
      // 打印当前连接的客户端
      const connectedClients = Object.values(clients).filter(
        client => client.ws && client.ws.readyState === WebSocket.OPEN
      );
      
      console.log(`当前有 ${connectedClients.length} 个连接的客户端:`);
      connectedClients.forEach(client => {
        console.log(`- 客户端ID: ${client.userId || '未认证'}`);
      });
      
      // 打印当前房间
      const allRooms = gameLogic.getAllRooms();
      console.log(`当前有 ${allRooms.length} 个房间:`);
      allRooms.forEach(room => {
        console.log(`- 房间ID: ${room.id}, 名称: ${room.name}, 主持人: ${room.host}, 玩家: ${room.playerCount}/${room.maxPlayers}`);
      });
      
    } catch (error) {
      console.error('调试信息打印失败:', error);
    }
  }, 60000); // 每分钟打印一次
  
  // 设置定期检查连接状态
  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) {
        console.log('WebSocket连接超时，关闭连接');
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 每30秒检查一次
  
  // 当WebSocket服务器关闭时清除定时器
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  return wss;
}

// 处理WebSocket消息
function handleMessage(ws, message) {
  try {
    const data = JSON.parse(message.toString());
    console.log('收到WebSocket消息:', data.type);
    
    // 处理 ping 消息
    if (data.type === 'ping') {
      sendToClient(ws, { type: 'pong', time: Date.now() });
      return;
    }
    
    // 处理认证
    if (data.type === 'authenticate') {
      handleAuthenticate(ws, data);
      return;
    }
    
    // 处理获取房间列表
    if (data.type === 'get_rooms') {
      handleGetRooms(ws, { filter: data.filter || 'all' });
      return;
    }
    
    // 处理获取房间详情
    if (data.type === 'get_room_info') {
      handleGetRoomInfo(ws, data);
      return;
    }
    
    // 以下消息类型需要认证
    if (!ws.authenticated) {
      sendError(ws, "未认证，请先登录");
      return;
    }
    
    // 根据消息类型处理
    switch (data.type) {
      case 'create_room':
        handleCreateRoom(ws, data);
        break;
      case 'join_room':
        handleJoinRoom(ws, data);
        break;
      case 'leave_room':
        handleLeaveRoom(ws, data);
        break;
      case 'start_game':
        handleStartGame(ws, data);
        break;
      case 'game_action':
        handleGameAction(ws, data);
        break;
      case 'chat':
        handleChatMessage(ws, data);
        break;
      case 'ready':
        handleReady(ws, data);
        break;
      default:
        console.log('未知的消息类型:', data.type);
    }
  } catch (error) {
    console.error('处理消息失败:', error);
    sendError(ws, `处理消息失败: ${error.message}`);
  }
}

// 处理认证
async function handleAuthenticate(ws, data) {
  try {
    const { token } = data;
    
    if (!token) {
      sendError(ws, "认证失败：未提供令牌");
      return;
    }
    
    try {
      // 验证 JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      
      // 获取用户信息
      const user = await getUserById(userId);
      
      if (!user) {
        throw new Error("用户不存在");
      }
      
      // 设置 WebSocket 用户信息
      ws.userId = userId;
      ws.username = user.username;
      ws.authenticated = true;
      
      console.log(`用户 ${userId} (${user.username}) 认证成功`);
      
      // 生成唯一的会话ID
      const sessionId = uuidv4();
      ws.sessionId = sessionId;
      
      // 初始化 players 对象，支持多会话
      if (!players[userId]) {
        players[userId] = {
          userId,
          username: user.username,
          sessions: {}
        };
      }
      
      // 添加新会话
      players[userId].sessions[sessionId] = {
        ws,
        lastActivity: Date.now()
      };
      
      // 更新用户名
      players[userId].username = user.username;
      
      // 发送认证成功消息
      sendToClient(ws, {
        type: 'authenticated',
        userId,
        username: user.username,
        sessionId
      });
      
      // 发送房间列表
      handleGetRooms(ws, { type: 'all' });
      
    } catch (error) {
      console.error('认证失败:', error);
      sendError(ws, `认证失败: ${error.message}`);
    }
  } catch (error) {
    console.error('处理认证失败:', error);
    sendError(ws, `认证失败: ${error.message}`);
  }
}

// 处理创建房间
async function handleCreateRoom(ws, data) {
  try {
    const { roomName, gameType, options } = data;
    const userId = getUserIdFromWebSocket(ws);
    
    if (!userId) {
      sendError(ws, "创建房间失败：用户未认证");
      return;
    }
    
    console.log(`用户 ${userId} 创建房间: ${roomName}`);
    
    // 确保 players 对象中有该用户
    ensurePlayerExists(userId, ws.username, ws);
    
    // 创建房间
    const roomId = await gameLogic.createRoom(userId, {
      name: roomName,
      gameType: gameType || 'quiz',
      ...options
    });
    
    // 获取创建的房间
    const room = gameLogic.getRoom(roomId);
    
    if (!room) {
      sendError(ws, "创建房间失败：内部错误");
      return;
    }
    
    // 发送成功消息
    sendToClient(ws, {
      type: 'roomCreated',
      room: sanitizeRoomData(room)
    });
    
    // 广播房间列表更新
    broadcastRoomListUpdate();
    
  } catch (error) {
    console.error('处理创建房间失败:', error);
    sendError(ws, `创建房间失败: ${error.message}`);
  }
}

// 处理加入房间
async function handleJoinRoom(ws, data) {
  try {
    const { roomId, password } = data;
    const userId = getUserIdFromWebSocket(ws);
    
    if (!userId) {
      sendError(ws, "加入房间失败：用户未认证");
      return;
    }
    
    console.log(`用户 ${userId} 请求加入房间 ${roomId}`);
    
    // 确保 players 对象中有该用户
    ensurePlayerExists(userId, ws.username, ws);
    
    // 加入房间
    const result = gameLogic.joinRoomById(roomId, userId, password);
    
    if (result.success) {
      // 发送加入成功消息
      sendToClient(ws, {
        type: 'roomJoined',
        success: true,
        room: sanitizeRoomData(result.room)
      });
      
      console.log(`用户 ${userId} 成功加入房间 ${roomId}`);
      
      // 广播房间更新给所有房间内的玩家
      broadcastRoomUpdate(result.room);
      
      // 广播房间列表更新给所有用户
      broadcastRoomListUpdate();
      
      // 保存到数据库
      try {
        await roomsDB.savePlayerToRoom(roomId, userId);
        console.log(`已保存用户 ${userId} 到房间 ${roomId} 的关系到数据库`);
      } catch (error) {
        console.error(`保存玩家 ${userId} 到房间 ${roomId} 失败:`, error);
      }
      
    } else {
      sendError(ws, result.error || "加入房间失败");
    }
    
  } catch (error) {
    console.error('处理加入房间失败:', error);
    sendError(ws, `加入房间失败: ${error.message}`);
  }
}

// 处理离开房间
function handleLeaveRoom(ws, data) {
  try {
    const userId = getUserIdFromWebSocket(ws);
    
    if (!userId) {
      sendError(ws, "离开房间失败：用户未认证");
      return;
    }
    
    // 获取玩家当前所在的房间
    const player = players[userId];
    if (!player || !player.roomId) {
      sendError(ws, "您不在任何房间中");
      return;
    }
    
    const roomId = player.roomId;
    
    console.log(`用户 ${userId} 离开房间 ${roomId}`);
    
    // 处理离开房间
    const result = gameLogic.leaveRoom(roomId, userId);
    
    if (result.success) {
      // 清除玩家房间信息
      delete player.roomId;
      
      // 发送离开成功消息
      sendToClient(ws, {
        type: 'roomLeft',
        roomId
      });
      
      // 如果房间仍然存在，广播房间更新
      if (result.room) {
        broadcastRoomUpdate(result.room);
      }
      
      // 广播房间列表更新
      broadcastRoomListUpdate();
    } else {
      sendError(ws, result.error || "离开房间失败");
    }
    
  } catch (error) {
    console.error('处理离开房间失败:', error);
    sendError(ws, `离开房间失败: ${error.message}`);
  }
}

// 处理开始游戏
function handleStartGame(ws, data) {
  try {
    const userId = getUserIdFromWebSocket(ws);
    
    if (!userId) {
      sendError(ws, "开始游戏失败：用户未认证");
      return;
    }
    
    const { roomId } = data;
    
    if (!roomId) {
      sendError(ws, "开始游戏失败：缺少房间ID");
      return;
    }
    
    console.log(`用户 ${userId} 尝试开始房间 ${roomId} 的游戏`);
    
    // 获取房间
    const room = gameLogic.rooms[roomId];
    if (!room) {
      sendError(ws, "房间不存在");
      return;
    }
    
    // 检查是否是房主
    if (room.host !== userId) {
      sendError(ws, "只有房主可以开始游戏");
      return;
    }
    
    // 根据游戏类型开始不同的游戏
    let result;
    if (room.gameType === gameLogic.GAME_TYPES.POKER) {
      result = gameLogic.startPokerGame(roomId);
    } else {
      result = gameLogic.startGame(roomId);
    }
    
    if (result.success) {
      // 向房间中的所有玩家广播游戏开始消息
      broadcastToRoom(roomId, {
        type: 'gameStarted',
        roomId,
        gameType: room.gameType
      });
      
      console.log(`房间 ${roomId} 的游戏已开始，类型: ${room.gameType}`);
      
      // 根据游戏类型发送不同的初始数据
      if (room.gameType === gameLogic.GAME_TYPES.POKER) {
        // 向每个玩家发送他们的牌
        room.players.forEach(playerId => {
          const playerClient = gameLogic.players[playerId]?.ws;
          if (playerClient && playerClient.readyState === WebSocket.OPEN) {
            const playerCards = room.game.playerCards[playerId];
            const playerState = room.game.playerStates[playerId];
            
            sendToClient(playerClient, {
              type: 'pokerGameStarted',
              holeCards: playerCards.holeCards,
              specialCards: playerCards.specialCards.map(card => ({
                index: playerCards.specialCards.indexOf(card),
                difficulty: card.difficulty,
                question: card.question,
                visible: card.visible,
                suit: card.visible ? card.suit : null,
                rank: card.visible ? card.rank : null
              })),
              chips: playerState.chips,
              positions: {
                dealer: room.game.dealerPosition,
                smallBlind: room.game.smallBlindPosition,
                bigBlind: room.game.bigBlindPosition,
                current: room.game.currentPlayer
              },
              blinds: room.options.blinds,
              pot: room.game.pot
            });
          }
        });
      } else {
        // 问答游戏初始化
        // ... 现有代码 ...
      }
      
      // 广播房间列表更新
      broadcastRoomListUpdate();
      
    } else {
      sendError(ws, result.error || "开始游戏失败");
    }
    
  } catch (error) {
    console.error('处理开始游戏失败:', error);
    sendError(ws, `开始游戏失败: ${error.message}`);
  }
}

// 处理获取房间列表
function handleGetRooms(ws, data) {
  try {
    const userId = getUserIdFromWebSocket(ws);
    
    // 获取过滤类型，默认为 'all'
    const filter = data.filter || 'all';
    
    console.log(`用户 ${userId || '未认证'} 请求获取房间列表，类型: ${filter}`);
    console.log('完整请求数据:', JSON.stringify(data));
    
    // 获取所有房间
    const allRooms = gameLogic.getAllRooms();
    console.log('所有房间:', JSON.stringify(allRooms));
    
    // 根据过滤类型筛选房间
    let filteredRooms = allRooms;
    
    if (filter !== 'all' && filter !== 'get_rooms') {
      console.log(`应用过滤条件: ${filter}`);
      filteredRooms = allRooms.filter(room => {
        // 实际的过滤逻辑
        let include = false;
        
        if (filter === 'waiting') {
          include = room.status === 'waiting';
        } else if (filter === 'playing') {
          include = room.status === 'playing';
        } else if (filter === 'idle') {
          include = room.status === 'idle';
        } else if (filter === 'my') {
          // 只返回用户创建或参与的房间
          include = room.host === userId || room.players.includes(userId);
        } else if (filter === 'topic') {
          // 按主题过滤
          include = room.options?.topic === data.topic;
                } else {
          // 默认包含所有房间
          include = true;
        }
        
        console.log(`房间 ${room.id} ${include ? '包含' : '排除'}`);
        return include;
      });
    }
    
    console.log(`过滤后剩余 ${filteredRooms.length} 个房间`);
    
    // 发送房间列表
    sendToClient(ws, {
      type: 'roomList',
      rooms: filteredRooms
    });
  } catch (error) {
    console.error('处理获取房间列表失败:', error);
    sendError(ws, `获取房间列表失败: ${error.message}`);
  }
}

// 处理游戏操作
function handleGameAction(ws, data) {
  try {
    const userId = getUserIdFromWebSocket(ws);
    
    if (!userId) {
      sendError(ws, "游戏操作失败：用户未认证");
      return;
    }
    
    const { roomId, action } = data;
    
    if (!roomId) {
      sendError(ws, "游戏操作失败：缺少房间ID");
      return;
    }
    
    if (!action) {
      sendError(ws, "游戏操作失败：缺少操作类型");
      return;
    }
    
    // 获取房间
    const room = gameLogic.rooms[roomId];
    if (!room) {
      sendError(ws, "房间不存在");
      return;
    }
    
    // 根据游戏类型处理不同的操作
    let result;
    if (room.gameType === gameLogic.GAME_TYPES.POKER) {
      console.log(`用户 ${userId} 在扑克游戏房间 ${roomId} 执行操作: ${action}`);
      result = gameLogic.handlePokerAction(roomId, userId, action, data);
    } else {
      // 默认为问答游戏
      console.log(`用户 ${userId} 在问答游戏房间 ${roomId} 执行操作: ${action}`);
      result = gameLogic.handleGameAction(roomId, userId, action, data);
    }
    
    if (result.success) {
      // 处理成功，根据操作类型发送不同的响应
      switch (action) {
        case 'answer':
          // ... 现有代码 ...
          break;
        
        case 'answer_question':
          // 处理扑克游戏中回答问题的结果
          sendToClient(ws, {
            type: 'answerQuestionResult',
            correct: result.correct,
            card: result.card,
            reward: result.reward,
            message: result.message
          });
          
          // 广播玩家回答了问题
          broadcastToRoom(roomId, {
            type: 'playerAnsweredQuestion',
            playerId: userId,
            correct: result.correct
          }, [userId]);
          break;
        
        case 'fold':
        case 'check':
        case 'call':
        case 'bet':
        case 'raise':
          // 广播玩家的扑克操作
          broadcastToRoom(roomId, {
            type: 'pokerAction',
            playerId: userId,
            action: action,
            amount: data.amount,
            nextPlayer: result.nextPlayer,
            pot: result.pot
          });
          break;
        
        case 'select_cards':
          // 广播玩家选择了卡牌
          broadcastToRoom(roomId, {
            type: 'playerSelectedCards',
            playerId: userId
          });
          
          // 如果所有玩家都选择了卡牌，发送游戏结果
          if (result.gameEnded) {
            broadcastToRoom(roomId, {
              type: 'pokerGameEnded',
              results: result.results
            });
          }
          break;
        
        default:
          // ... 其他操作 ...
      }
    } else {
      sendError(ws, result.error || "游戏操作失败");
    }
    
  } catch (error) {
    console.error('处理游戏操作失败:', error);
    sendError(ws, `处理游戏操作失败: ${error.message}`);
  }
}

// 处理聊天消息
function handleChatMessage(ws, data) {
  try {
    const userId = getUserIdFromWebSocket(ws);
    
    if (!userId) {
      sendError(ws, "发送聊天消息失败：用户未认证");
      return;
    }
    
    const { roomId, message } = data;
    
    if (!roomId) {
      sendError(ws, "发送聊天消息失败：缺少房间ID");
      return;
    }
    
    if (!message || !message.trim()) {
      sendError(ws, "发送聊天消息失败：消息不能为空");
      return;
    }
    
    // 检查用户是否在指定房间中
    if (!players[userId] || players[userId].roomId !== roomId) {
      sendError(ws, "您不在该房间中");
      return;
    }
    
    // 检查房间是否存在
    const room = rooms[roomId];
    if (!room) {
      sendError(ws, "房间不存在");
      return;
    }
    
    console.log(`用户 ${userId} 在房间 ${roomId} 发送聊天消息: ${message}`);
    
    // 获取用户信息
    getUserById(userId)
      .then(user => {
        if (!user) {
          throw new Error("用户不存在");
        }
        
        // 创建聊天消息对象
        const chatMessage = {
          type: 'chatMessage',
          senderId: userId,
          senderName: user.username,
          message: message.trim(),
          timestamp: Date.now()
        };
        
        // 向房间中的所有玩家广播聊天消息
        room.players.forEach(playerId => {
          const playerClient = players[playerId]?.ws;
          if (playerClient && playerClient.readyState === WebSocket.OPEN) {
            sendToClient(playerClient, chatMessage);
          }
        });
      })
      .catch(error => {
        console.error('发送聊天消息失败:', error);
        sendError(ws, `发送聊天消息失败: ${error.message}`);
      });
    
  } catch (error) {
    console.error('处理聊天消息失败:', error);
    sendError(ws, `处理聊天消息失败: ${error.message}`);
  }
}

// 处理准备状态
function handleReady(ws, data) {
  try {
    const userId = getUserIdFromWebSocket(ws);
    
    if (!userId) {
      sendError(ws, "设置准备状态失败：用户未认证");
      return;
    }
    
    const { roomId, ready } = data;
    
    if (!roomId) {
      sendError(ws, "设置准备状态失败：缺少房间ID");
      return;
    }
    
    if (ready === undefined) {
      sendError(ws, "设置准备状态失败：缺少准备状态");
      return;
    }
    
    console.log(`用户 ${userId} 在房间 ${roomId} 设置准备状态: ${ready}`);
    
    // 检查用户是否在指定房间中
    if (!players[userId] || players[userId].roomId !== roomId) {
      sendError(ws, "您不在该房间中");
      return;
    }
    
    // 检查房间是否存在
    const room = rooms[roomId];
    if (!room) {
      sendError(ws, "房间不存在");
      return;
    }
    
    // 检查游戏是否已开始
    if (room.status === 'playing') {
      sendError(ws, "游戏已开始，无法更改准备状态");
      return;
    }
    
    // 设置准备状态
    const result = gameLogic.setPlayerReady(roomId, userId, ready);
    
    if (result.success) {
      // 向房间中的所有玩家广播准备状态更新
      room.players.forEach(playerId => {
        const playerClient = players[playerId]?.ws;
        if (playerClient && playerClient.readyState === WebSocket.OPEN) {
          sendToClient(playerClient, {
            type: 'playerReady',
            playerId: userId,
            ready
          });
        }
      });
      
      // 如果所有玩家都已准备好，通知房主
      if (result.allReady && room.players.length >= 2) {
        const hostClient = players[room.host]?.ws;
        if (hostClient && hostClient.readyState === WebSocket.OPEN) {
          sendToClient(hostClient, {
            type: 'allPlayersReady'
          });
        }
      }
    } else {
      sendError(ws, result.error || "设置准备状态失败");
    }
    
  } catch (error) {
    console.error('处理准备状态失败:', error);
    sendError(ws, `处理准备状态失败: ${error.message}`);
  }
}

// 向房间中的所有玩家广播消息
function broadcastToRoom(roomId, data, excludePlayers = []) {
  const room = rooms[roomId];
  if (!room) return;
  
  room.players.forEach(playerId => {
    if (!excludePlayers.includes(playerId)) {
      const playerClient = players[playerId]?.ws;
      if (playerClient && playerClient.readyState === WebSocket.OPEN) {
        sendToClient(playerClient, data);
      }
    }
  });
}

// 向指定玩家发送消息
function sendToPlayer(playerId, data) {
  const player = players[playerId];
  if (!player) return;
  
  // 如果是新的多会话结构
  if (player.sessions) {
    // 向玩家的所有会话发送消息
    Object.values(player.sessions).forEach(session => {
      if (session.ws && session.ws.readyState === WebSocket.OPEN) {
        sendToClient(session.ws, data);
      }
    });
  } 
  // 兼容旧结构
  else if (player.ws && player.ws.readyState === WebSocket.OPEN) {
    player.ws.send(JSON.stringify(data));
  }
}

// 向房间中的所有玩家广播消息
function broadcast(roomId, data, excludePlayers = []) {
  const room = rooms[roomId];
  if (!room) return;
  
  room.players.forEach(playerId => {
    if (!excludePlayers.includes(playerId)) {
      sendToPlayer(playerId, data);
            }
        });
    }

// 向指定用户的所有会话发送消息
function sendToUser(userId, data) {
  const user = players[userId];
  if (!user || !user.sessions) {
    return;
  }
  
  // 向用户的所有活跃会话发送消息
  Object.values(user.sessions).forEach(session => {
    if (session.ws && session.ws.readyState === WebSocket.OPEN) {
      sendToClient(session.ws, data);
    }
  });
}

// 处理获取房间详情
function handleGetRoomInfo(ws, data) {
  try {
    const userId = getUserIdFromWebSocket(ws);
    const { roomId } = data;
    
    console.log(`用户 ${userId || '未认证'} 请求获取房间 ${roomId} 的详情`);
    
    if (!roomId) {
      sendError(ws, "获取房间详情失败：缺少房间ID");
      return;
    }
    
    // 获取房间信息
    const room = gameLogic.getRoom(roomId);
    
    if (!room) {
      sendError(ws, `房间 ${roomId} 不存在`);
      return;
    }
    
    console.log(`向用户 ${userId || '未认证'} 发送房间 ${roomId} 的详情`);
    
    // 发送房间详情
    sendToClient(ws, {
      type: 'roomInfo',
      room: sanitizeRoomData(room)
    });
    
  } catch (error) {
    console.error('处理获取房间详情失败:', error);
    sendError(ws, `获取房间详情失败: ${error.message}`);
  }
}

module.exports = {
  initWebSocket,
  rooms,
  players,
  clients,
  broadcast,
  sendToPlayer,
  sendToClient,
  sendError,
  handleCreateRoom,
  handleJoinRoom,
  handleStartGame,
  handleGetRooms,
  handleLeaveRoom,
  handleGameAction,
  handleChatMessage,
  handleReady,
  broadcastToRoom,
  getUserIdFromWebSocket,
  broadcastRoomUpdate,
  broadcastRoomListUpdate,
  sendToUser,
  handleGetRoomInfo
};