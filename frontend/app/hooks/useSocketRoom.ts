'use client';

import { useState, useEffect } from 'react';
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
}

export function useSocketRoom(): UseSocketRoomResult {
  const { socketClient, isConnected } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socketClient) return;

    // 监听房间列表
    const handleRoomList = (data: { rooms: Room[] }) => {
      setRooms(data.rooms || []);
      setIsLoading(false);
    };

    // 监听房间信息
    const handleRoomInfo = (data: { room: Room }) => {
      if (data.room) {
        setCurrentRoom(data.room);
      }
      setIsLoading(false);
    };

    // 监听房间更新
    const handleRoomUpdated = (data: { room: Room }) => {
      if (data.room) {
        setCurrentRoom(data.room);
      }
    };

    // 监听房间列表更新
    const handleRoomListUpdated = () => {
      if (socketClient) {
        socketClient.getRooms();
      }
    };

    // 监听房间加入
    const handleRoomJoined = (data: { room: Room }) => {
      if (data.room) {
        setCurrentRoom(data.room);
      }
      setIsLoading(false);
    };

    // 监听房间离开
    const handleRoomLeft = () => {
      setCurrentRoom(null);
      setIsLoading(false);
    };

    // 监听错误
    const handleError = (data: { message: string }) => {
      setError(data.message);
      setIsLoading(false);
    };

    // 注册事件监听器
    socketClient.on('roomList', handleRoomList);
    socketClient.on('roomInfo', handleRoomInfo);
    socketClient.on('roomUpdated', handleRoomUpdated);
    socketClient.on('roomListUpdated', handleRoomListUpdated);
    socketClient.on('room_joined', handleRoomJoined);
    socketClient.on('room_left', handleRoomLeft);
    socketClient.on('error', handleError);

    // 清理函数
    return () => {
      socketClient.off('roomList', handleRoomList);
      socketClient.off('roomInfo', handleRoomInfo);
      socketClient.off('roomUpdated', handleRoomUpdated);
      socketClient.off('roomListUpdated', handleRoomListUpdated);
      socketClient.off('room_joined', handleRoomJoined);
      socketClient.off('room_left', handleRoomLeft);
      socketClient.off('error', handleError);
    };
  }, [socketClient]);

  // 获取房间列表
  const getRooms = (filter: string = 'all') => {
    if (!socketClient || !isConnected) {
      setError('Socket未连接');
      return;
    }

    setIsLoading(true);
    setError(null);
    socketClient.getRooms(filter);
  };

  // 创建房间
  const createRoom = (options: any) => {
    if (!socketClient || !isConnected) {
      setError('Socket未连接');
      return;
    }

    setIsLoading(true);
    setError(null);
    socketClient.createRoom(options);
  };

  // 加入房间
  const joinRoom = (roomId: string, password?: string) => {
    if (!socketClient || !isConnected) {
      setError('Socket未连接');
      return;
    }

    setIsLoading(true);
    setError(null);
    socketClient.joinRoom(roomId, password);
  };

  // 离开房间
  const leaveRoom = () => {
    if (!socketClient || !isConnected || !currentRoom) {
      return;
    }

    setIsLoading(true);
    setError(null);
    socketClient.leaveRoom(currentRoom.id);
  };

  // 获取房间信息
  const getRoomInfo = (roomId: string) => {
    if (!socketClient || !isConnected) {
      setError('Socket未连接');
      return;
    }

    setIsLoading(true);
    setError(null);
    socketClient.getRoomInfo(roomId);
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
    getRoomInfo
  };
} 