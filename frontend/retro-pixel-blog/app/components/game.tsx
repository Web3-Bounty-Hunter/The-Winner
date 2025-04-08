import { useSocket } from '../providers/socket-provider';
import { useSocketRoom } from '../hooks/useSocketRoom';

function Game() {
  const { socketClient } = useSocket();
  const { createRoom, joinRoom, leaveRoom, currentRoom } = useSocketRoom();
  
  const handleCreateGame = () => {
    createRoom({
      name: 'MyGame',
      maxPlayers: 10,
      isVisible: true,
    });
  };
  
  const handleJoinGame = (roomId) => {
    joinRoom(roomId);
  };
  
  const handleLeaveGame = () => {
    leaveRoom();
  };
} 