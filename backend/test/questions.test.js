const assert = require('assert');
const request = require('supertest');
const { app, start, close } = require('../server');
const { PORT } = require('../config');

describe('Questions Routes Tests', function() {
    this.timeout(30000); // 增加超时时间，因为真实API调用可能需要更长时间
    
    let server;
    
    before(function(done) {
        server = start(PORT + 2); // 使用不同的端口
        setTimeout(done, 1000); // 等待服务器启动
    });
    
    after(function(done) {
        close();
        done();
    });
    
    it('should post a mock question', function(done) {
        request(app)
            .post('/api/questions')
            .send({
                topic: '区块链基础',
                difficulty: '简单',
                testMode: true
            })
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                assert(res.body.success);
                assert.strictEqual(res.body.message, '题目已添加到题库');
                done();
            });
    });
    
    // 启用真实API测试
    it('should post a question with real Dify API', function(done) {
        this.timeout(10000); // 增加超时时间
        
        request(app)
            .post('/api/questions')
            .send({
                topic: '区块链基础',
                difficulty: '简单',
                testMode: false
            })
            .expect((res) => {
                // 如果 API 调用失败，检查是否返回了合适的错误信息
                if (res.status !== 200) {
                    console.log('API Response:', res.body);
                    if (res.body.error === 'Dify API 调用失败') {
                        // 标记测试为跳过
                        this.skip();
                        return;
                    }
                }
                // 如果成功，验证返回的数据
                assert(res.body.success);
                assert(res.body.message);
                if (res.body.dyfiResponse) {
                    assert(res.body.dyfiResponse.data);
                    const data = res.body.dyfiResponse.data;
                    assert(data.question);
                    assert(Array.isArray(data.options));
                    assert(data.correctAnswer);
                    assert(data.explanation);
                }
            })
            .end(done);
    });
    
    it('should get questions by difficulty', function(done) {
        request(app)
            .get('/api/questions?difficulty=简单')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                assert(Array.isArray(res.body));
                done();
            });
    });
});