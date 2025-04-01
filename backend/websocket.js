const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const gameLogic = require('./gameLogic');

// 存储房间和玩家信息
const rooms = {};
const players = {};

function initWebSocket(server) {
    const wss = new WebSocket.Server({ server });
    
    // 初始化 gameLogic 模块
    gameLogic.init({
        rooms,
        players,
        broadcast,
        sendToPlayer
    });
    
    wss.on('connection', (ws) => {
        // 为新连接的玩家生成唯一ID
        const playerId = uuidv4();
        players[playerId] = { ws, roomId: null };
        
        // 发送连接成功消息
        ws.send(JSON.stringify({
            type: 'connected',
            playerId
        }));
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                
                switch (data.type) {
                    case 'create_room':
                    case 'createRoom':
                        handleCreateRoom(playerId);
                        break;
                    case 'join_room':
                    case 'joinRoom':
                        handleJoinRoom(playerId, data.roomId);
                        break;
                    case 'answer':
                        // 使用 gameLogic 中的 handleAnswer
                        gameLogic.handleAnswer(playerId, data.questionId, data.answer);
                        break;
                    case 'bet':
                        // 使用 gameLogic 中的 handleBet
                        gameLogic.handleBet(playerId, data.amount);
                        break;
                    default:
                        console.log('未知消息类型:', data.type);
                }
            } catch (error) {
                console.error('处理WebSocket消息时出错:', error);
            }
        });
        
        ws.on('close', () => {
            // 处理玩家断开连接
            const player = players[playerId];
            if (player && player.roomId) {
                const room = rooms[player.roomId];
                if (room) {
                    // 从房间中移除玩家
                    room.players = room.players.filter(id => id !== playerId);
                    
                    // 如果房间没有玩家了，删除房间
                    if (room.players.length === 0) {
                        delete rooms[player.roomId];
                    } else {
                        // 通知房间中的其他玩家
                        broadcast(player.roomId, {
                            type: 'player_left',
                            playerId
                        });
                    }
                }
            }
            
            // 删除玩家记录
            delete players[playerId];
        });
    });
}

// 创建房间
function handleCreateRoom(playerId) {
    const roomId = uuidv4();
    rooms[roomId] = {
        id: roomId,
        players: [playerId],
        gameState: 'waiting'
    };
    
    // 更新玩家所在房间
    players[playerId].roomId = roomId;
    
    // 通知玩家房间创建成功
    sendToPlayer(playerId, {
        type: 'room_created',
        roomId
    });
    
    return roomId;
}

// 加入房间
function handleJoinRoom(playerId, roomId) {
    const room = rooms[roomId];
    
    if (!room) {
        return sendToPlayer(playerId, {
            type: 'error',
            message: '房间不存在'
        });
    }
    
    // 将玩家添加到房间
    room.players.push(playerId);
    players[playerId].roomId = roomId;
    
    // 通知玩家加入成功
    sendToPlayer(playerId, {
        type: 'room_joined',
        roomId,
        players: room.players
    });
    
    // 通知房间中的其他玩家
    broadcast(roomId, {
        type: 'player_joined',
        playerId
    }, [playerId]);
    
    return true;
}

// 向指定玩家发送消息
function sendToPlayer(playerId, data) {
    const player = players[playerId];
    if (player && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(data));
    }
}

// 向房间中的所有玩家广播消息
function broadcast(roomId, data, excludePlayers = []) {
    const room = rooms[roomId];
    if (!room) return;
    
    room.players.forEach(playerId => {
        if (!excludePlayers.includes(playerId)) {
            sendToPlayer(playerId, data);
        }
    });
}

// 检查玩家是否存在
function hasPlayer(playerId) {
    return !!players[playerId];
}

module.exports = {
    initWebSocket,
    rooms,
    players,
    broadcast,
    sendToPlayer,
    handleCreateRoom,
    handleJoinRoom,
    hasPlayer
};