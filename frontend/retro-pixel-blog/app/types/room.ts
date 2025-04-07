// 更新 Room 类型定义，使其与后端数据匹配
export interface Room {
  id: string;
  name: string;
  host: string;
  players: any[];
  maxPlayers: number;
  status: string;
  createdAt: string | number;
  isPrivate: boolean;
  hasPassword?: boolean;
  gameType?: string;
  options?: {
    buyIn?: number;
    blinds?: number[];
    topic?: string;
    difficulty?: string;
  };
  game?: any;
  playerStatus?: Record<string, any>;
} 