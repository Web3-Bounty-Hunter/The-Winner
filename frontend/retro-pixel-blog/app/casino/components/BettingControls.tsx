import React, { useState } from 'react';

interface BettingControlsProps {
  currentBet: number;
  playerStack: number;
  onBet: (amount: number) => void;
  onFold: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
}

const BettingControls: React.FC<BettingControlsProps> = ({
  currentBet,
  playerStack,
  onBet,
  onFold,
  onCall,
  onRaise
}) => {
  const [raiseAmount, setRaiseAmount] = useState(currentBet * 2)

  return (
    <div className="betting-controls">
      <button onClick={onFold}>弃牌</button>
      <button onClick={onCall}>跟注 ({currentBet})</button>
      <div>
        <input 
          type="range"
          min={currentBet * 2}
          max={playerStack}
          value={raiseAmount}
          onChange={e => setRaiseAmount(Number(e.target.value))}
        />
        <button onClick={() => onRaise(raiseAmount)}>加注到 {raiseAmount}</button>
      </div>
    </div>
  )
}

export default BettingControls; 