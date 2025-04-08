const assert = require('assert');
const request = require('supertest');
const WebSocket = require('ws');
const { app, start, close } = require('../server');
const { PORT } = require('../config');

describe('Server Tests', function () {
    this.timeout(5000);
    let server;

    before(function(done) {
        server = start(PORT);
        done();
    });

    after(function(done) {
        close();
        done();
    });

    it('should respond to GET /api/questions', (done) => {
        request(app)
            .get('/api/questions')
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                assert(Array.isArray(res.body));
                done();
            });
    });

    it('should establish WebSocket connection', (done) => {
        const ws = new WebSocket(`ws://localhost:${PORT}`);
        ws.on('open', () => {
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                assert.strictEqual(data.type, 'connected');
                assert(data.playerId);
                ws.close();
                done();
            });
        });
        ws.on('error', (err) => done(err));
    });
});