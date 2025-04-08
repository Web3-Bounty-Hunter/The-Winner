const { db } = require('./database');
const { deck } = require('./utils');

// 存储引用，稍后初始化
let rooms = {};
let players = {};
let broadcast = () => {};
let sendToPlayer = () => {};

// 初始化函数，在 websocket.js 中调用
function init(websocketModules) {
    rooms = websocketModules.rooms;
    players = websocketModules.players;
    broadcast = websocketModules.broadcast;
    sendToPlayer = websocketModules.sendToPlayer;
}

function startGame(roomId) {
    const room = rooms[roomId];
    if (!room || room.players.length < 2) return;

    const shuffledDeck = deck().sort(() => Math.random() - 0.5);
    const communityCards = shuffledDeck.splice(0, 5);
    room.gameState = { phase: 'preflop', communityCards, currentPlayerIndex: 0, pot: 0, roundTimer: null };

    room.players.forEach((playerId) => {
        const player = players[playerId];
        if (!player) return;
        
        player.cards = shuffledDeck.splice(0, 5).map((card, i) => ({
            value: card,
            revealed: false,
            difficulty: i < 2 ? 'easy' : i === 2 ? 'medium' : i === 3 ? 'hard' : 'hell'
        }));
        
        sendToPlayer(playerId, { 
            type: 'gameStarted', 
            cards: player.cards 
        });
    });

    nextPhase(roomId);
}

async function handleAnswer(playerId, questionId, answer) {
    const player = players[playerId];
    if (!player || !player.roomId) return;
    
    broadcast(player.roomId, {
        type: 'player_answered',
        playerId,
        questionId,
        answer
    });
    
    return {
        correct: true,
        points: 10
    };
}

function handleBet(playerId, amount) {
    const player = players[playerId];
    if (!player || !player.roomId) return;
    
    broadcast(player.roomId, {
        type: 'player_bet',
        playerId,
        amount
    });
    
    return {
        success: true,
        newBalance: 100 - amount
    };
}

function nextPhase(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    
    const { phase, communityCards } = room.gameState;

    if (phase === 'preflop') {
        room.gameState.phase = 'flop';
        broadcast(roomId, { type: 'flop', cards: communityCards.slice(0, 3) });
    } else if (phase === 'flop') {
        room.gameState.phase = 'turn';
        broadcast(roomId, { type: 'turn', card: communityCards[3] });
    } else if (phase === 'turn') {
        room.gameState.phase = 'river';
        broadcast(roomId, { type: 'river', card: communityCards[4] });
    } else if (phase === 'river') {
        endGame(roomId);
        return;
    }

    room.gameState.roundTimer = setTimeout(() => nextPhase(roomId), 30000);
}

function endGame(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    
    broadcast(roomId, { 
        type: 'gameEnded', 
        winner: room.players[0] 
    });
    
    delete rooms[roomId];
}

module.exports = { 
    init,
    startGame, 
    handleAnswer, 
    handleBet 
};