interface GameEndModalProps {
    isOpen: boolean;
    winners: Player[];
    pot: number;
    onPlayAgain: () => void;
    onExit: () => void;
  }
  
  const GameEndModal: React.FC<GameEndModalProps> = ({
    isOpen,
    winners,
    pot,
    onPlayAgain,
    onExit
  }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4">游戏结束</h2>
          <div className="mb-4">
            <h3 className="text-xl mb-2">获胜者：</h3>
            {winners.map(winner => (
              <div key={winner.id} className="flex justify-between">
                <span>{winner.username}</span>
                <span>获得 {pot / winners.length} 筹码</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-4">
            <button 
              onClick={onPlayAgain}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              再来一局
            </button>
            <button 
              onClick={onExit}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              退出房间
            </button>
          </div>
        </div>
      </div>
    )
  }