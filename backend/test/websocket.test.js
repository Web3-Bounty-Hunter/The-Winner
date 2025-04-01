const assert = require('assert');
const WebSocket = require('ws');
const { start, close } = require('../server');
const { PORT } = require('../config');

describe('WebSocket Tests', function() {
    this.timeout(10000);
    
    let server;
    let client1;
    let client2;
    let player1Id;
    let player2Id;
    let roomId;
    
    before(function(done) {
        server = start(PORT + 3);
        setTimeout(() => {
            client1 = new WebSocket(`ws://localhost:${PORT + 3}`);
            
            client1.on('open', () => {
                client1.on('message', (message) => {
                    const data = JSON.parse(message.toString());
                    if (data.type === 'connected') {
                        player1Id = data.playerId;
                        
                        client2 = new WebSocket(`ws://localhost:${PORT + 3}`);
                        client2.on('open', () => {
                            client2.on('message', (message) => {
                                const data = JSON.parse(message.toString());
                                if (data.type === 'connected') {
                                    player2Id = data.playerId;
                                    done();
                                }
                            });
                        });
                    }
                });
            });
        }, 1000);
    });
    
    after(function(done) {
        if (client1 && client1.readyState === WebSocket.OPEN) {
            client1.close();
        }
        
        if (client2 && client2.readyState === WebSocket.OPEN) {
            client2.close();
        }
        
        close();
        done();
    });
    
    it('should create a room and join it', function(done) {
        let roomCreated = false;
        let roomJoined = false;
        
        client1.on('message', (message) => {
            const data = JSON.parse(message.toString());
            if (data.type === 'room_created') {
                roomId = data.roomId;
                roomCreated = true;
                
                // 玩家2加入房间
                client2.send(JSON.stringify({
                    type: 'joinRoom',
                    roomId
                }));
            }
        });
        
        client2.on('message', (message) => {
            const data = JSON.parse(message.toString());
            if (data.type === 'room_joined') {
                roomJoined = true;
                assert.strictEqual(data.roomId, roomId);
                assert(data.players.includes(player1Id));
                assert(data.players.includes(player2Id));
                done();
            }
        });
        
        // 玩家1创建房间
        client1.send(JSON.stringify({
            type: 'createRoom'
        }));
    });
    
    it('should handle player disconnection', function(done) {
        client1.on('message', (message) => {
            const data = JSON.parse(message.toString());
            if (data.type === 'player_left') {
                assert.strictEqual(data.playerId, player2Id);
                done();
            }
        });
        
        // 关闭玩家2的连接
        client2.close();
    });
});