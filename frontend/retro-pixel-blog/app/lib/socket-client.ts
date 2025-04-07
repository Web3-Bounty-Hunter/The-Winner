import socketService from '../../services/socket';

export interface SocketClientOptions {
  autoConnect?: boolean;
  token?: string;
}

export class SocketClient {
  private static instance: SocketClient;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(options: SocketClientOptions = {}) {
    if (SocketClient.instance) {
      return SocketClient.instance;
    }

    // 初始化 Socket.IO 连接
    if (options.autoConnect !== false) {
      this.connect(options.token);
    }

    SocketClient.instance = this;
  }

  // 连接到服务器
  connect(token?: string): void {
    console.log('Socket客户端: 正在连接...');
    socketService.initializeSocket(token);
  }

  // 断开连接
  disconnect(): void {
    console.log('Socket客户端: 正在断开连接...');
    socketService.closeSocket();
  }

  // 获取连接状态
  isConnected(): boolean {
    return socketService.isConnected;
  }

  // 获取用户ID
  getUserId(): string | null {
    return socketService.userId;
  }

  // 获取玩家ID
  getPlayerId(): string | null {
    return socketService.playerId;
  }

  // 添加事件监听器
  on(eventName: string, callback: Function): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.push(callback);
      
      // 在 Socket.IO 服务上注册
      socketService.addEventListener(eventName, callback as any);
    }
  }

  // 移除事件监听器
  off(eventName: string, callback?: Function): void {
    if (!callback) {
      // 移除所有指定事件的处理程序
      this.eventHandlers.delete(eventName);
    } else if (this.eventHandlers.has(eventName)) {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index !== -1) {
          handlers.splice(index, 1);
          socketService.removeEventListener(eventName, callback as any);
        }
      }
    }
  }

  // 获取房间列表
  getRooms(filter: string = 'all'): void {
    socketService.getRooms(filter);
  }

  // 创建房间
  createRoom(options: any = {}): void {
    socketService.createRoom(options);
  }

  // 加入房间
  joinRoom(roomId: string, password?: string): void {
    socketService.joinRoom(roomId, password);
  }

  // 离开房间
  leaveRoom(roomId?: string): void {
    socketService.leaveRoom(roomId);
  }

  // 准备游戏
  ready(isReady: boolean = true, roomId?: string): void {
    socketService.ready(isReady, roomId);
  }

  // 开始游戏
  startGame(roomId?: string): void {
    socketService.startGame(roomId);
  }

  // 游戏操作
  gameAction(action: string, data: any = {}, roomId?: string): void {
    socketService.gameAction(action, data, roomId);
  }

  // 发送聊天消息
  sendChatMessage(message: string, roomId?: string): void {
    socketService.sendChatMessage(message, roomId);
  }

  // 获取房间信息
  getRoomInfo(roomId: string): void {
    socketService.getRoomInfo(roomId);
  }

  // 获取单例实例
  static getInstance(options: SocketClientOptions = {}): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient(options);
    }
    return SocketClient.instance;
  }
}

// 导出单例实例
export default SocketClient.getInstance; 