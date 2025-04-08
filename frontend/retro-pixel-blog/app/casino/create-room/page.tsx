"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSocket from '@/hooks/useSocket';
import styles from './CreateRoom.module.css';

export default function CreateRoomPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [buyIn, setBuyIn] = useState(100);
  const [topic, setTopic] = useState('general');
  const [difficulty, setDifficulty] = useState('medium');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 监听房间创建响应
  useEffect(() => {
    if (!socket) return;
    
    const handleRoomCreated = (data) => {
      setIsCreating(false);
      
      if (data.success) {
        setSuccess('房间创建成功！');
        // 显示成功消息后，延迟导航到房间页面
        setTimeout(() => {
          router.push(`/casino/room/${data.room.id}`);
        }, 1000);
      } else {
        setError(data.error || '创建房间失败');
      }
    };
    
    socket.on('roomCreated', handleRoomCreated);
    
    return () => {
      socket.off('roomCreated', handleRoomCreated);
    };
  }, [socket, router]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!roomName.trim()) {
      setError('请输入房间名称');
      return;
    }
    
    if (isPrivate && !password.trim()) {
      setError('请设置房间密码');
      return;
    }
    
    setIsCreating(true);
    
    // 发送创建房间请求
    socket.emit('createRoom', {
      name: roomName,
      isPrivate,
      password: isPrivate ? password : null,
      maxPlayers,
      options: {
        buyIn,
        topic,
        difficulty
      }
    });
  };
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>创建房间</h1>
      
      {success && <div className={styles.success}>{success}</div>}
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 表单内容保持不变 */}
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={() => router.back()}
          >
            取消
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isCreating}
          >
            {isCreating ? '创建中...' : '创建房间'}
          </button>
        </div>
      </form>
    </div>
  );
} 