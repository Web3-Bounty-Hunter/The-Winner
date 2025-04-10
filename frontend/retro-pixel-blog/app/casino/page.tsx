"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import GlitchEffect from "../components/GlitchEffect"
import { useAuth } from "../context/auth-context"
import { useSocket } from "@/app/providers/socket-provider"
import { useSocketRoom } from "../hooks/useSocketRoom"
import LoadingScreen from "../components/LoadingScreen"
import RoomCard from "./components/RoomCard"
import CreateRoomForm from "./components/CreateRoomForm"
import JoinRoomByIdForm from "./components/JoinRoomByIdForm"
import RoomCreatedModal from "./components/RoomCreatedModal"
import { toast } from "sonner"
import SocketDebugger from "../components/SocketDebugger"

const MOCK_ROOMS = [
  {
    id: '1',
    name: '德州扑克房间1',
    host: 'system',
    players: [],
    maxPlayers: 6,
    status: 'waiting',
    createdAt: new Date().toISOString(),
    isPrivate: false,
    password: null,
    gameType: 'poker',
    options: {
      buyIn: 1000,
      blinds: [10, 20],
      topic: 'general',
      difficulty: 'medium'
    }
  },
  {
    id: '2',
    name: '德州扑克房间2',
    host: 'system',
    players: [],
    maxPlayers: 6,
    status: 'waiting',
    createdAt: new Date().toISOString(),
    isPrivate: false,
    password: null,
    gameType: 'poker',
    options: {
      buyIn: 2000,
      blinds: [20, 40],
      topic: 'blockchain',
      difficulty: 'hard'
    }
  }
];

export default function CasinoPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { socketClient, isConnected } = useSocket()
  const { rooms, currentRoom, createRoom, joinRoom, leaveRoom, getRooms, setRooms } = useSocketRoom()

  const [view, setView] = useState<"list" | "create" | "join">("list")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null)
  const [createdRoomName, setCreatedRoomName] = useState<string>("")
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState("all")

  // 获取房间列表
  const fetchRooms = useCallback(() => {
    setIsRefreshing(true)
    setError(null)

    console.log("正在获取房间列表...")
    try {
      getRooms(filter)
      console.log("已发送获取房间列表请求")
    } catch (err) {
      console.error("获取房间列表失败:", err)
      setError("获取房间列表失败，请稍后重试")
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
        if (isLoading) {
          console.log("获取房间列表超时，手动结束加载状态")
          setIsLoading(false)
        }
      }, 500)
    }
  }, [filter, getRooms, isLoading])

  // 定义处理函数
  const handleRoomList = useCallback((data) => {
    console.log("收到房间列表:", data)
    setRooms(data.rooms || [])
    setIsLoading(false)
    setIsRefreshing(false)
  }, [])
  
  const handleRoomListUpdated = useCallback(() => {
    fetchRooms()
  }, [fetchRooms])

  // 初始加载
  useEffect(() => {
    console.log('使用模拟房间数据');
    
    // 直接设置模拟房间数据
    setRooms(MOCK_ROOMS);
    setIsLoading(false);
    
    // 模拟定期更新房间玩家数量
    const interval = setInterval(() => {
      setRooms(prevRooms => 
        prevRooms.map(room => ({
          ...room,
          players: Array(Math.floor(Math.random() * 4) + 1).fill(null).map((_, i) => ({
            id: `player-${i}`,
            username: `player${Math.floor(Math.random() * 100)}`,
            isReady: Math.random() > 0.5,
            isHost: i === 0
          }))
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 监控状态变化
  useEffect(() => {
    // 减少日志频率
    const isDebugSample = Math.random() < 0.1; // 只有10%的更新会记录
    
    if (isDebugSample) {
      console.log("状态更新：", { 
        isLoading, 
        roomsCount: rooms.length, 
        roomsData: rooms,
        error,
        isConnected,
        socketId: socketClient?.id 
      });
    }
  
    // 如果有房间数据但仍然处于加载状态，强制结束加载
    if (rooms.length > 0 && isLoading) {
      console.log("检测到房间数据但仍处于加载状态，强制结束加载");
      setIsLoading(false);
    }
  
    // 如果Socket ID存在但isConnected为false，记录异常
    if (socketClient?.id && !isConnected && isDebugSample) {
      console.warn("异常状态：Socket ID存在但isConnected为false");
    }
  }, [isLoading, rooms, error, isConnected, socketClient]);

  // 处理创建房间
  const handleCreateRoom = async (data: any) => {
    setIsCreatingRoom(true);
    setError(null);

    try {
      console.log("正在创建房间，数据:", data);
      
      // 添加防重复提交保护
      if (createdRoomId) {
        console.warn("已有房间创建进行中，忽略重复请求");
        return;
      }
      
      createRoom({
        name: data.name,
        maxPlayers: data.maxPlayers,
        isPrivate: data.isPrivate,
        password: data.password,
        gameType: 'quiz',
        options: {
          topic: data.topic,
          difficulty: data.difficulty
        },
        onRoomCreated: (response) => {
          console.log("房间创建成功:", response);
          
          // 检查响应有效性
          if (!response || !response.roomId) {
            console.error("收到无效房间创建响应:", response);
            toast.error("房间创建失败，请重试");
            setIsCreatingRoom(false);
            return;
          }
          
          setCreatedRoomId(response.roomId);
          setCreatedRoomName(data.name);
          setIsCreatingRoom(false);
          setView("list");
          // 刷新房间列表
          fetchRooms();
        }
      });
      
      // 设置10秒后强制结束创建状态
      setTimeout(() => {
        if (isCreatingRoom) {
          console.log("创建房间超时，重置状态");
          setIsCreatingRoom(false);
        }
      }, 10000);
      
    } catch (err) {
      console.error("创建房间出错:", err);
      setError("创建房间失败，请稍后重试");
      setIsCreatingRoom(false);
    }
  };

  // 修改加入房间的处理函数
  const handleJoinRoom = useCallback(async (roomId: string) => {
    setIsJoiningRoom(true);
    
    try {
      // 模拟加入房间的延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 直接导航到房间页面
      router.push(`/casino/room/${roomId}`);
    } catch (error) {
      console.error('加入房间失败:', error);
      toast.error('加入房间失败，请重试');
    } finally {
      setIsJoiningRoom(false);
    }
  }, [router]);

  // 处理进入创建的房间
  const handleEnterCreatedRoom = () => {
    if (createdRoomId) {
      router.push(`/casino/room/${createdRoomId}`)
    }
  }

  // 处理刷新房间列表
  const handleRefreshRooms = () => {
    fetchRooms()
  }

  // 处理视图切换
  const handleViewChange = (newView: "list" | "create" | "join") => {
    setView(newView)
    
    // 如果切换到房间列表视图，刷新房间列表
    if (newView === "list") {
      fetchRooms()
    }
  }

  if (authLoading || (isLoading && rooms.length === 0)) {
    return <LoadingScreen />
  }

  return (
    <div className="casino-container">
      <h1 className="casino-title font-elvpixels03 text-lg">Scholar's Gamble</h1>
      <h3 className="casino-title font-elvpixels03 text-sm">Use your knowledge as your most precious bargaining chip.</h3>
      
      <div className="casino-actions">
        <button 
          className="casino-create-button"
          onClick={() => setView("create")}
          style={{ fontSize: "0.4rem" }}
        >
          Create Room
        </button>
        <button
          className="casino-refresh-button"
          onClick={handleRefreshRooms}
          disabled={isRefreshing}
          style={{ fontSize: "0.4rem" }}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Room"}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Close</button>
        </div>
      )}
      
      <div className="casino-room-list">
        <h2 className="casino-subtitle" style={{ fontSize: "0.5rem", color: "purple" }}>Available Rooms</h2>
        
        {isLoading && rooms.length === 0 ? (
          <div className="casino-loading">
            <p>Loading...</p>
            <p>Socket status: {isConnected ? "Connected" : "未连接"}</p>
            <p>Socket ID: {socketClient?.id || "null"}</p>
            <div className="flex flex-col gap-2 mt-4">
              <button 
                onClick={() => {
                  console.log("当前房间数据:", rooms);
                  setIsLoading(false);
                  // 手动强制更新连接状态
                  if (socketClient && socketClient.connected) {
                    const socketProvider = document.querySelector('#socket-provider').__reactFiber$;
                    if (socketProvider && socketProvider._debugOwner) {
                      const socketProviderInstance = socketProvider._debugOwner.stateNode;
                      if (socketProviderInstance && typeof socketProviderInstance.setIsConnected === 'function') {
                        console.log('正在手动更新Socket连接状态');
                        socketProviderInstance.setIsConnected(true);
                      }
                    }
                  }
                }}
                className="mt-4 px-4 py-2 bg-blue-600 rounded"
                style={{
                  border: '1px solid #00ff00',
                  color: '#00ff00',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                force show room list
              </button>
              <button 
                onClick={() => {
                  console.log("发送测试事件");
                  socketClient?.emit('test_event', { message: '手动测试连接' });
                }}
                className="mt-2 px-4 py-2"
                style={{
                  border: '1px solid #ffff00',
                  color: '#ffff00',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                测试Socket连接
              </button>
            </div>
          </div>
        ) : error ? (
          <p className="casino-error">{error}</p>
        ) : rooms.length === 0 ? (
          <div className="casino-empty">
            <p>No available rooms</p>
            <button onClick={handleRefreshRooms}>refresh list</button>
            <button onClick={() => setView("create")}>Create new room</button>
          </div>
        ) : (
          <div className="casino-grid">
            {rooms.map(room => (
              <RoomCard 
                key={room.id}
                room={room}
                onJoin={(password) => handleJoinRoom(room.id)}
              />
            ))}
          </div>
        )}
      </div>

      {view === "create" && (
        <>
          <h2 className="text-lg font-squares mb-6" style={{ fontSize: "0.55rem" }}>
            Create Quiz Room
          </h2>
          <CreateRoomForm
            onCancel={() => setView("list")}
            onSubmit={handleCreateRoom}
            isLoading={isCreatingRoom}
          />
        </>
      )}

      {view === "join" && (
        <>
          <h2 className="text-lg font-squares mb-6" style={{ fontSize: "0.55rem" }}>
            Join Room by ID
          </h2>
          <JoinRoomByIdForm onJoin={handleJoinRoom} isLoading={isJoiningRoom} />
          <GlitchEffect triggerOnHover={true}>
            <Button
              onClick={() => {
                setView("list")
                fetchRooms()
              }}
              variant="outline"
              className="font-squares text-xs"
              style={{ fontSize: "0.35rem" }}
            >
              Back 
            </Button>
          </GlitchEffect>
        </>
      )}

      {/* Room created modal */}
      {createdRoomId && (
        <RoomCreatedModal
          roomId={createdRoomId}
          roomName={createdRoomName}
          onJoin={handleEnterCreatedRoom}
          onClose={() => {
            setCreatedRoomId(null)
            setCreatedRoomName("")
            setView("list")
            handleRefreshRooms()
          }}
        />
      )}

      {/* Socket调试器 */}
      <SocketDebugger />
    </div>
  )
}

