'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../providers/socket-provider';

interface Room {
  id: string;
  name: string;
  host: string;
  players: string[];
  maxPlayers: number;
  status: string;
  // 其他房间属性...
}

interface UseSocketRoomResult {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  getRooms: (filter?: string) => void;
  createRoom: (options: any) => void;
  joinRoom: (roomId: string, password?: string) => void;
  leaveRoom: () => void;
  getRoomInfo: (roomId: string) => void;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
}

export function useSocketRoom(): UseSocketRoomResult {
  const { socketClient, isConnected } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用 ref 来追踪事件监听状态和防抖
  const eventListenersRef = useRef({ initialized: false });
  const getRoomRef = useRef<{ lastCallTime: number, timeoutId: any }>({ 
    lastCallTime: 0, 
    timeoutId: null 
  });

  useEffect(() => {
    // 防止重复添加事件监听器
    if (eventListenersRef.current.initialized) {
      return;
    }
    
    if (!socketClient) return;
    eventListenersRef.current.initialized = true;
    
    // 添加测试事件
    console.log('添加测试事件监听器');
    socketClient.emit('test_event', { message: '这是一个测试消息' });
    
    socketClient.on('test_response', (data) => {
      console.log('收到测试响应:', data);
      
      // 测试事件成功后，手动发送一个 getRooms 请求
      socketClient.emit('getRooms', { filter: 'all' });
    });
    
    // 监听房间列表更新
    socketClient.on('roomList', (data) => {
      console.log('收到房间列表更新:', data);
      setRooms(data.rooms || []);
      
      // 检查是否有足够的房间，如果没有，强制更新连接状态
      if (data.rooms && data.rooms.length > 0) {
        console.log("强制更新状态：发现", data.rooms.length, "个房间");
        setIsLoading(false);
      }
    });
    
    // 恢复监听房间信息
    socketClient.on('roomInfo', (data) => {
      console.log('收到房间信息:', data);
      if (data.room) {
        setCurrentRoom(data.room);
        setIsLoading(false);
      }
    });
    
    // 监听房间更新
    socketClient.on('roomUpdated', (data) => {
      console.log('收到房间更新:', data);
      if (data.room) {
        setCurrentRoom(data.room);
      }
    });
    
    // 监听加入房间事件
    socketClient.on('room_joined', (data) => {
      console.log('已加入房间:', data);
      if (data.room) {
        setCurrentRoom(data.room);
        setIsLoading(false);
      }
    });
    
    // 监听离开房间事件
    socketClient.on('room_left', () => {
      console.log('已离开房间');
      setCurrentRoom(null);
      setIsLoading(false);
    });
    
    // 监听错误
    socketClient.on('error', (data) => {
      console.error('收到错误:', data);
      setError(data.message || '发生错误');
      setIsLoading(false);
    });
    
    return () => {
      if (socketClient) {
        socketClient.off('test_response');
        socketClient.off('roomList');
        socketClient.off('roomInfo');
        socketClient.off('roomUpdated');
        socketClient.off('room_joined');
        socketClient.off('room_left');
        socketClient.off('error');
        // 清理标记，允许在组件重新挂载时再次初始化
        eventListenersRef.current.initialized = false;
      }
    };
  }, []);

  // 获取房间列表
  const getRooms = useCallback((filter = 'all') => {
    // 防止频繁调用
    const now = Date.now();
    const lastCallTime = getRoomRef.current.lastCallTime || 0;
    if (now - lastCallTime < 2000) {
      console.log("忽略频繁的房间列表请求");
      return;
    }
    getRoomRef.current.lastCallTime = now;
    
    if (!socketClient || !isConnected) {
      console.warn('Socket未连接，无法获取房间列表');
      return;
    }
    
    console.log("发送 getRooms 请求，过滤条件:", filter);
    console.log("Socket.id:", socketClient.id, ", Connected:", socketClient.connected);
    console.log("Socket.io 连接状态:", socketClient);
    
    socketClient.emit('getRooms', { filter });
    
    // 30秒内检查是否收到了响应
    // 使用防抖处理，避免多次检查
    if (getRoomRef.current.timeoutId) {
      clearTimeout(getRoomRef.current.timeoutId);
    }
    
    getRoomRef.current.timeoutId = setTimeout(() => {
      console.log("检查是否收到了房间列表响应...");
      // 这里可以添加更多逻辑
    }, 500);
  }, [socketClient, isConnected]);

  // 创建房间
  const createRoom = (options: any) => {
    if (!socketClient || !isConnected) {
      console.warn('Socket状态显示未连接，但尝试强制发送请求');
      // 即使 isConnected 为 false，也尝试发送请求
    }

    setIsLoading(true);
    setError(null);
    console.log("发送创建房间请求:", options);
    
    // 保存回调函数
    const onRoomCreated = options.onRoomCreated;
    delete options.onRoomCreated; // 从发送给服务器的数据中删除回调函数
    
    // 添加调试信息
    console.log("Socket ID:", socketClient?.id);
    console.log("Socket 连接状态:", socketClient?.connected);
    
    socketClient?.emit('createRoom', options);
    
    // 设置一次性监听器
    if (onRoomCreated) {
      // 确保移除之前可能存在的监听器，避免重复
      socketClient?.off('room_created');
      
      const handleRoomCreatedOnce = (data: any) => {
        console.log("收到房间创建响应(一次性):", JSON.stringify(data, null, 2));
        // 确保只处理成功的创建，避免错误回调
        if (data && data.success) {
          onRoomCreated(data);
        } else {
          console.error("创建房间失败:", data?.error || "未知错误");
          setError(data?.error || "创建房间失败，请稍后重试");
        }
        socketClient?.off('room_created', handleRoomCreatedOnce);
        setIsLoading(false);
      };
      
      // 添加超时处理
      const timeoutId = setTimeout(() => {
        console.error("创建房间响应超时");
        socketClient?.off('room_created', handleRoomCreatedOnce);
        setIsLoading(false);
        setError('创建房间超时，请稍后重试');
      }, 10000); // 10秒超时
      
      socketClient?.on('room_created', (data) => {
        clearTimeout(timeoutId);
        handleRoomCreatedOnce(data);
      });
    }
  };

  // 加入房间
  const joinRoom = (roomId: string, password?: string) => {
    if (!socketClient || !isConnected) {
      setError('Socket未连接');
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(`请求加入房间 ${roomId}`, password ? "带密码" : "无密码");
    socketClient.emit('joinRoom', { roomId, password });
  };

  // 离开房间
  const leaveRoom = () => {
    if (!socketClient || !isConnected || !currentRoom) {
      return;
    }

    setIsLoading(true);
    setError(null);
    socketClient.emit('leaveRoom', { roomId: currentRoom.id });
  };

  // 获取房间信息
  const getRoomInfo = (roomId: string) => {
    if (!socketClient || !isConnected) {
      setError('Socket未连接');
      return;
    }

    console.log(`正在获取房间 ${roomId} 信息，Socket ID: ${socketClient.id}`);
    setIsLoading(true);
    setError(null);
    socketClient.emit('getRoomInfo', { roomId });
    
    // 添加额外的调试检查
    setTimeout(() => {
      if (!currentRoom) {
        console.warn(`获取房间 ${roomId} 信息超时，尝试重新获取`);
        socketClient.emit('getRoomInfo', { roomId });
      }
    }, 2000);
  };

  return {
    rooms,
    currentRoom,
    isLoading,
    error,
    getRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    getRoomInfo,
    setRooms
  };
} 