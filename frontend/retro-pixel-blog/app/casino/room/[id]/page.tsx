"use client"

import React, { useContext } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { SocketContext } from '../../../providers/socket-provider'
import { useSocketRoom } from '../../../hooks/useSocketRoom'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RoomPage() {
  const params = useParams()
  const id = params?.id
  const router = useRouter()
  
  // 定义socketContext作为组件级变量
  const socketContext = useContext(SocketContext)
  
  // 连接状态
  let connectionStatus = "未知"
  try {
    connectionStatus = socketContext?.isConnected ? "已连接" : "未连接"
    console.log('Socket上下文:', socketContext)
  } catch (err) {
    console.error('使用SocketContext时出错:', err)
    connectionStatus = "错误"
  }
  
  const { currentRoom, getRoomInfo, leaveRoom } = useSocketRoom()
  const [isReady, setIsReady] = useState(false)
  const [players, setPlayers] = useState([])
  const [isHost, setIsHost] = useState(false)
  const [gameStatus, setGameStatus] = useState('waiting')
  
  // 调试功能
  const [showDebug, setShowDebug] = useState(false);
  
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };
  
  // 处理玩家准备状态
  const handleReady = useCallback(() => {
    if (!socketContext || !socketContext.isConnected) {
      toast.error('网络连接异常，请刷新页面')
      return
    }
    
    socketContext.socketClient?.emit('playerReady', { roomId: id, ready: !isReady })
    setIsReady(prev => !prev)
  }, [socketContext, id, isReady])
  
  // 处理开始游戏
  const handleStartGame = useCallback(() => {
    if (!socketContext || !socketContext.isConnected) {
      toast.error('网络连接异常，请刷新页面')
      return
    }
    
    socketContext.socketClient?.emit('startGame', { roomId: id })
  }, [socketContext, id])
  
  // 处理离开房间
  const handleLeaveRoom = useCallback(() => {
    if (!socketContext || !socketContext.isConnected) {
      // 如果连接有问题，直接返回大厅
      router.push('/casino')
      return
    }
    
    leaveRoom()
    router.push('/casino')
  }, [socketContext, leaveRoom, router])
  
  useEffect(() => {
    if (socketContext?.isConnected && id) {
      console.log(`获取房间 ${id} 信息`)
      getRoomInfo(id)
      
      // 处理房间不存在错误
      const handleRoomError = (data) => {
        if (data.message && data.message.includes('不存在')) {
          toast.error('房间不存在或已关闭');
          // 延迟返回大厅
          setTimeout(() => {
            router.push('/casino');
          }, 2000);
        }
      };
      
      socketContext.socketClient?.on('error', handleRoomError);
      
      // 设置房间信息更新监听
      const socket = socketContext.socketClient
      if (socket) {
        console.log('设置房间更新监听器')
        socket.on('roomUpdated', (data) => {
          console.log('房间信息更新:', data)
          if (data.room) {
            // 检查当前用户是否是房主
            const playerId = socket.playerId || socket.id
            setIsHost(data.room.host === playerId)
            
            // 更新玩家列表
            setPlayers(data.room.players || [])
            
            // 更新游戏状态
            setGameStatus(data.room.status)
            
            // 更新准备状态
            if (data.room.playerStatus && playerId) {
              setIsReady(data.room.playerStatus[playerId]?.ready || false)
            }
          }
        })
        
        // 监听游戏开始事件
        socket.on('gameStarted', (data) => {
          console.log('游戏开始:', data)
          setGameStatus('playing')
          toast.success('游戏开始!')
        })
        
        return () => {
          socket.off('roomUpdated')
          socket.off('gameStarted')
          socket.off('error', handleRoomError)
        }
      }
    }
  }, [socketContext, id, getRoomInfo, router])
  
  // 根据房间类型渲染不同游戏界面
  const renderGameUI = () => {
    if (!currentRoom) return <div>加载中...</div>
    
    // 根据房间类型渲染不同游戏界面
    switch (currentRoom.gameType) {
      case 'quiz':
        return <div className="quiz-game">知识竞赛游戏界面</div>
      case 'poker':
        return <div className="poker-game">德州扑克游戏界面</div>
      default:
        return <div>未知游戏类型</div>
    }
  }
  
  return (
    <div className="room-container p-4">
      <div className="room-header flex justify-between mb-4">
        <h1 className="text-xl font-bold">
          {currentRoom?.name || '加载中...'} ({id})
        </h1>
        <div className="room-status">
          状态: <span className={`status-${gameStatus}`}>
            {gameStatus === 'waiting' ? '等待中' : 
             gameStatus === 'playing' ? '游戏中' : '已结束'}
          </span>
        </div>
      </div>
      
      <div className="room-content grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="players-list md:col-span-1 bg-black/30 p-4 rounded">
          <h2 className="text-lg font-bold mb-2">玩家列表</h2>
          {players.length === 0 && (!currentRoom || !currentRoom.players || currentRoom.players.length === 0) ? (
            <p>暂无玩家</p>
          ) : (
            <ul>
              {(players.length > 0 ? players : currentRoom?.players || []).map(player => (
                <li key={player} className="flex justify-between mb-2">
                  <span>{player}</span>
                  {currentRoom?.playerStatus?.[player]?.ready && (
                    <span className="text-green-400">已准备</span>
                  )}
                  {currentRoom?.host === player && (
                    <span className="text-yellow-400">房主</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="game-area md:col-span-2 bg-black/30 p-4 rounded">
          {gameStatus === 'playing' ? (
            renderGameUI()
          ) : (
            <div className="waiting-room flex flex-col items-center justify-center h-full">
              <h2 className="text-xl mb-4">等待游戏开始</h2>
              <div className="controls flex gap-4">
                <button 
                  onClick={handleReady}
                  className={`px-4 py-2 rounded ${isReady ? 'bg-red-600' : 'bg-green-600'}`}
                >
                  {isReady ? '取消准备' : '准备'}
                </button>
                
                {isHost && (
                  <button 
                    onClick={handleStartGame}
                    className="px-4 py-2 bg-blue-600 rounded"
                    disabled={!isHost || players.length < 2}
                  >
                    开始游戏
                  </button>
                )}
                
                <button 
                  onClick={handleLeaveRoom}
                  className="px-4 py-2 bg-gray-600 rounded"
                >
                  离开房间
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <Link href="/casino" className="text-blue-400 hover:underline">
          返回大厅
        </Link>
        <button 
          onClick={toggleDebug}
          className="ml-4 text-gray-400 hover:text-white text-xs"
        >
          {showDebug ? '隐藏' : '显示'}调试信息
        </button>
        
        {showDebug && (
          <div className="mt-4 p-4 bg-black/50 rounded text-xs">
            <h3 className="text-gray-300 mb-2">原始房间数据:</h3>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(currentRoom, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 