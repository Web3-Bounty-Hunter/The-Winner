import { io } from 'socket.io-client';

// 连接设置
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'; // 在生产环境中使用适当的URL
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

  // 错误消息
  socket.on('error', (data) => {
    console.error('Socket错误:', data);
    triggerEvent('error', data);
  });

  // 房间创建
  socket.on('room_created', (data) => {
    console.log('房间创建成功:', data);
    triggerEvent('roomCreated', data);
  });

  // 加入房间
  socket.on('room_joined', (data) => {
    console.log('成功加入房间:', data);
    triggerEvent('roomJoined', data);
  });

  // 离开房间
  socket.on('room_left', (data) => {
    console.log('成功离开房间:', data);
    triggerEvent('roomLeft', data);
  });

  // 房间列表
  socket.on('roomList', (data) => {
    console.log('收到房间列表:', data);
    triggerEvent('roomList', data);
  });

  // 房间列表更新
  socket.on('roomListUpdated', (data) => {
    console.log('房间列表已更新');
    triggerEvent('roomListUpdated', data);
  });

  // 房间信息
  socket.on('roomInfo', (data) => {
    console.log('收到房间信息:', data);
    triggerEvent('roomInfo', data);
  });

  // 房间更新
  socket.on('roomUpdated', (data) => {
    console.log('房间已更新:', data);
    triggerEvent('roomUpdated', data);
  });

  // 游戏开始
  socket.on('gameStarted', (data) => {
    console.log('游戏已开始:', data);
    triggerEvent('gameStarted', data);
  });

  // 游戏结束
  socket.on('gameEnded', (data) => {
    console.log('游戏已结束:', data);
    triggerEvent('gameEnded', data);
  });

  // 游戏更新
  socket.on('gameUpdated', (data) => {
    console.log('游戏已更新:', data);
    triggerEvent('gameUpdated', data);
  });

  // 聊天消息
  socket.on('chatMessage', (data) => {
    console.log('收到聊天消息:', data);
    triggerEvent('chatMessage', data);
  });

  // ping/pong保活
  socket.on('ping', (data) => {
    socket.emit('pong', { time: Date.now() });
  });

  return socket;
}

// 处理断开连接
function handleDisconnection() {
  isConnected = false;
  triggerEvent('connectionChange', { connected: false });
  
  // 如果超过最大重连次数，停止重连
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log(`已达到最大重连尝试次数(${MAX_RECONNECT_ATTEMPTS})，停止重连`);
    return;
  }
  
  // 增加重连尝试次数
  reconnectAttempts++;
  
  // 清除之前的重连定时器
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  // 设置重连定时器
  console.log(`将在 ${RECONNECT_DELAY}ms 后尝试重连，尝试次数: ${reconnectAttempts}`);
  reconnectTimeout = setTimeout(() => {
    console.log(`尝试重连 #${reconnectAttempts}...`);
    
    // 重新连接
    if (socket) {
      socket.connect();
    }
  }, RECONNECT_DELAY);
}

// 关闭连接
export function closeSocket() {
  if (socket) {
    console.log('关闭Socket.IO连接');
    socket.disconnect();
    socket = null;
    isConnected = false;
    reconnectAttempts = 0;
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  }
}

// 触发事件
function triggerEvent(eventName, data) {
  // 调用注册的事件处理程序
  if (eventListeners[eventName]) {
    eventListeners[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`执行 ${eventName} 事件处理程序时出错:`, error);
      }
    });
  }
  
  // 触发通用窗口事件（与现有代码兼容）
  window.dispatchEvent(new CustomEvent(`ws:${eventName}`, { detail: data }));
}

// API 函数

// 添加事件监听器
export function addEventListener(eventName, callback) {
  if (!eventListeners[eventName]) {
    eventListeners[eventName] = [];
  }
  eventListeners[eventName].push(callback);
  
  return () => removeEventListener(eventName, callback);
}

// 移除事件监听器
export function removeEventListener(eventName, callback) {
  if (eventListeners[eventName]) {
    eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback);
  }
}

// 认证
export function authenticate(token) {
  if (!isConnected) {
    console.warn('Socket未连接，无法认证');
    return false;
  }
  
  socket.emit('authenticate', { token });
  return true;
}

// 获取房间列表
export function getRooms(filter = 'all') {
  if (!isConnected) {
    console.warn('Socket未连接，无法获取房间列表');
    return false;
  }
  
  socket.emit('get_rooms', { filter });
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
  if (!isConnected) {
    console.warn('Socket未连接，无法发送聊天消息');
    return false;
  }
  
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