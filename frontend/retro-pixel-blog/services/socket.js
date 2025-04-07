import { io } from 'socket.io-client';

// 连接设置
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

// 创建Socket.IO实例
let socket;
let reconnectAttempts = 0;
let reconnectTimeout;

// 存储事件处理程序
const eventListeners = {};

// 连接状态
let isConnected = false;
let userId = null;
let playerId = null;

// 初始化连接
export function initializeSocket(token) {
  if (socket) {
    console.log('Socket已初始化，重用现有连接');
    return socket;
  }

  console.log('初始化Socket.IO连接...');
  
  socket = io(SOCKET_URL, {
    reconnection: false, // 我们将手动处理重连
    auth: { token }
  });

  // 连接事件
  socket.on('connect', () => {
    console.log('Socket.IO已连接');
    isConnected = true;
    reconnectAttempts = 0;
    triggerEvent('connectionChange', { connected: true });
  });

  // 连接错误
  socket.on('connect_error', (error) => {
    console.error('Socket连接错误:', error);
    handleDisconnection();
  });

  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log(`Socket断开连接: ${reason}`);
    isConnected = false;
    handleDisconnection();
  });

  // 认证成功
  socket.on('authenticated', (data) => {
    console.log('Socket认证成功:', data);
    userId = data.userId;
    triggerEvent('authenticated', data);
  });

  // 连接确认
  socket.on('connected', (data) => {
    console.log('Socket连接确认:', data);
    playerId = data.playerId;
    triggerEvent('connected', data);
  });

  // 错误处理
  socket.on('error', (data) => {
    console.error('Socket错误:', data);
    triggerEvent('error', data);
  });

  // Ping/Pong
  socket.on('ping', (data) => {
    socket.emit('pong', { time: data.time });
  });

  return socket;
}

// 手动处理断开连接
function handleDisconnection() {
  triggerEvent('connectionChange', { connected: false });
  
  // 清除之前的重连尝试
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  // 尝试重连
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    console.log(`尝试重连... (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    
    reconnectTimeout = setTimeout(() => {
      reconnectAttempts++;
      
      if (socket) {
        socket.connect();
      } else {
        initializeSocket();
      }
    }, RECONNECT_DELAY);
  } else {
    console.log('达到最大重连尝试次数，不再重连');
  }
}

// 关闭连接
export function closeSocket() {
  if (socket) {
    console.log('关闭Socket连接');
    socket.disconnect();
    socket = null;
    isConnected = false;
    
    // 清除重连
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    reconnectAttempts = 0;
    triggerEvent('connectionChange', { connected: false });
  }
}

// 触发事件
function triggerEvent(eventName, data) {
  if (eventListeners[eventName]) {
    eventListeners[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件处理错误 (${eventName}):`, error);
      }
    });
  }
}

// 添加事件监听器
export function addEventListener(eventName, callback) {
  if (!eventListeners[eventName]) {
    eventListeners[eventName] = [];
  }
  
  eventListeners[eventName].push(callback);
  
  // 如果是Socket.IO事件，添加监听
  if (socket && ['roomList', 'roomInfo', 'roomUpdated'].includes(eventName)) {
    socket.on(eventName, callback);
  }
}

// 移除事件监听器
export function removeEventListener(eventName, callback) {
  if (!eventListeners[eventName]) {
    return;
  }
  
  // 查找回调索引
  const index = eventListeners[eventName].indexOf(callback);
  
  if (index !== -1) {
    eventListeners[eventName].splice(index, 1);
    
    // 如果是Socket.IO事件，移除监听
    if (socket && ['roomList', 'roomInfo', 'roomUpdated'].includes(eventName)) {
      socket.off(eventName, callback);
    }
  }
}

// 认证
export function authenticate(token) {
  if (!isConnected) {
    console.warn('Socket未连接，无法认证');
    return false;
  }
  
  // 重新初始化带认证的连接
  closeSocket();
  initializeSocket(token);
  return true;
}

// 获取房间列表
export function getRooms(filter = 'all') {
  if (!isConnected) {
    console.warn('Socket未连接，无法获取房间列表');
    return false;
  }
  
  socket.emit('getRooms', { filter });
  return true;
}

// 创建房间
export function createRoom(options = {}) {
  if (!isConnected) {
    console.warn('Socket未连接，无法创建房间');
    return false;
  }
  
  socket.emit('createRoom', options);
  return true;
}

// 加入房间
export function joinRoom(roomId, password = null) {
  if (!isConnected) {
    console.warn('Socket未连接，无法加入房间');
    return false;
  }
  
  socket.emit('joinRoom', { roomId, password });
  return true;
}

// 离开房间
export function leaveRoom(roomId = null) {
  if (!isConnected) {
    console.warn('Socket未连接，无法离开房间');
    return false;
  }
  
  socket.emit('leaveRoom', { roomId });
  return true;
}

// 准备游戏
export function ready(isReady = true, roomId = null) {
  if (!isConnected) {
    console.warn('Socket未连接，无法准备游戏');
    return false;
  }
  
  socket.emit('ready', { ready: isReady, roomId });
  return true;
}

// 开始游戏
export function startGame(roomId = null) {
  if (!isConnected) {
    console.warn('Socket未连接，无法开始游戏');
    return false;
  }
  
  socket.emit('startGame', { roomId });
  return true;
}

// 游戏操作
export function gameAction(action, data = {}, roomId = null) {
  if (!isConnected) {
    console.warn('Socket未连接，无法执行游戏操作');
    return false;
  }
  
  socket.emit('gameAction', { action, data, roomId });
  return true;
}

// 发送聊天消息
export function sendChatMessage(message, roomId = null) {
  if (!isConnected || !socket) {
    console.warn('Socket未连接，无法发送聊天消息');
    return false;
  }
  
  console.log('发送聊天消息:', { message, roomId });
  socket.emit('chatMessage', { message, roomId });
  return true;
}

// 获取房间信息
export function getRoomInfo(roomId) {
  if (!isConnected) {
    console.warn('Socket未连接，无法获取房间信息');
    return false;
  }
  
  socket.emit('get_room_info', { roomId, timestamp: Date.now() });
  return true;
}

// 导出Socket和连接状态
export default {
  initializeSocket,
  closeSocket,
  addEventListener,
  removeEventListener,
  authenticate,
  getRooms,
  createRoom,
  joinRoom,
  leaveRoom,
  ready,
  startGame,
  gameAction,
  sendChatMessage,
  getRoomInfo,
  // 状态访问器
  get isConnected() { return isConnected; },
  get userId() { return userId; },
  get playerId() { return playerId; }
}; 