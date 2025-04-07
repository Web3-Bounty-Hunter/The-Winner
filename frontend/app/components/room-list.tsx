'use client';

import { useEffect } from 'react';
import { useSocketRoom } from '../hooks/useSocketRoom';

export default function RoomList() {
  const { rooms, isLoading, error, getRooms, joinRoom, createRoom } = useSocketRoom();

  useEffect(() => {
    // 页面加载时获取房间列表
    getRooms();
    
    // 每60秒刷新一次
    const intervalId = setInterval(() => {
      getRooms();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [getRooms]);

  const handleCreateRoom = () => {
    createRoom({
      name: `房间 ${Math.floor(Math.random() * 1000)}`,
      maxPlayers: 10,
      gameType: 'quiz'
    });
  };

  return (
    <div className="room-list">
      <h2>房间列表</h2>
      
      <button onClick={handleCreateRoom} disabled={isLoading}>
        创建新房间
      </button>
      
      <button onClick={() => getRooms()} disabled={isLoading}>
        刷新列表
      </button>
      
      {isLoading && <div>加载中...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {rooms.length === 0 && !isLoading && (
        <div>没有可用的房间，请创建一个新房间</div>
      )}
      
      <ul>
        {rooms.map(room => (
          <li key={room.id}>
            <div>
              <strong>{room.name}</strong> [状态: {room.status}]
            </div>
            <div>
              玩家: {room.players.length} / {room.maxPlayers}
            </div>
            <button 
              onClick={() => joinRoom(room.id)}
              disabled={isLoading || room.status !== 'waiting' || room.players.length >= room.maxPlayers}
            >
              加入房间
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 