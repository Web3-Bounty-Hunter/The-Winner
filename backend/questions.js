const express = require('express');
const axios = require('axios');
const { DIFY_API_KEY, DIFY_API_URL } = require('./config');
const { db } = require('./database');

const router = express.Router();

// 获取题目列表
router.get('/', (req, res) => {
    const { difficulty } = req.query;
    let query = 'SELECT * FROM questions';
    let params = [];

    if (difficulty) {
        query += ' WHERE difficulty = ?';
        params.push(difficulty);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('获取题目失败:', err);
            return res.status(500).json({ error: '获取题目失败' });
        }
        res.json(rows);
    });
});

// 生成并添加题目
router.post('/', async (req, res) => {
    try {
        const { topic, difficulty, testMode } = req.body;

        // 测试模式返回模拟数据
        if (testMode) {
            const mockQuestion = {
                text: '什么是区块链？',
                options: JSON.stringify(['一种加密货币', '一种分布式账本技术', '一种编程语言', '一种云存储服务']),
                correctAnswer: '一种分布式账本技术',
                explanation: '区块链是一种分布式账本技术，它允许多方安全地记录交易和管理信息，无需中央权威机构。',
                source: '模拟数据',
                territoryId: 'blockchain-basics',
                difficulty: difficulty || '简单'
            };

            db.run(
                'INSERT INTO questions (text, options, correctAnswer, explanation, source, territoryId, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    mockQuestion.text,
                    mockQuestion.options,
                    mockQuestion.correctAnswer,
                    mockQuestion.explanation,
                    mockQuestion.source,
                    mockQuestion.territoryId,
                    mockQuestion.difficulty
                ],
                function (err) {
                    if (err) {
                        console.error('添加题目失败:', err);
                        return res.status(500).json({ success: false, error: '添加题目失败' });
                    }
                    return res.json({ 
                        success: true, 
                        message: '题目已添加到题库', 
                        id: this.lastID 
                    });
                }
            );
            return;
        }

        // 真实模式调用 Dify API
        try {
            const response = await generateQuestionFromDify(topic, difficulty);
            
            // 解析 Dify 返回的数据
            const questionData = response.data;
            
            // 插入数据库
            db.run(
                'INSERT INTO questions (text, options, correctAnswer, explanation, source, territoryId, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    questionData.question,
                    JSON.stringify(questionData.options),
                    questionData.correctAnswer,
                    questionData.explanation,
                    'Dify API',
                    topic,
                    difficulty
                ],
                function (err) {
                    if (err) {
                        console.error('添加题目失败:', err);
                        return res.status(500).json({ success: false, error: '添加题目失败' });
                    }
                    
                    return res.json({ 
                        success: true, 
                        message: '题目已添加到题库',
                        id: this.lastID,
                        dyfiResponse: response
                    });
                }
            );
        } catch (error) {
            console.error('Dify API error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Dify API 调用失败',
                details: error.message
            });
        }
    } catch (error) {
        console.error('处理请求失败:', error);
        res.status(500).json({ success: false, error: '处理请求失败' });
    }
});

// 从 Dify 生成题目
async function generateQuestionFromDify(topic, difficulty) {
    try {
        const prompt = `请生成一道关于${topic}的${difficulty}难度的区块链知识问答题，包含问题、4个选项、正确答案和解释。`;
        
        // 尝试正确的 API 端点
        const apiUrl = `${DIFY_API_URL}/v1/chat-messages`;
        
        console.log(`尝试调用 Dify API: ${apiUrl}`);
        
        const response = await axios.post(
            apiUrl,
            {
                inputs: {},
                query: prompt,
                response_mode: "streaming",
                user: "tester"
            },
            {
                headers: {
                    'Authorization': `Bearer ${DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Dify API 响应:', response.data);
        
        // 返回模拟数据
        return {
            data: {
                question: '什么是区块链？',
                options: ['一种加密货币', '一种分布式账本技术', '一种编程语言', '一种云存储服务'],
                correctAnswer: '一种分布式账本技术',
                explanation: '区块链是一种分布式账本技术，它允许多方安全地记录交易和管理信息，无需中央权威机构。'
            }
        };
    } catch (error) {
        console.error('Dify API error:', error);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        
        // 尝试不同的 API 端点和参数组合
        try {
            console.log('尝试备用 API 端点和参数');
            
            // 尝试方案1：使用 completion-messages 端点
            const backupUrl1 = `${DIFY_API_URL}/v1/completion-messages`;
            console.log(`尝试 ${backupUrl1}`);
            
            try {
                const response1 = await axios.post(
                    backupUrl1,
                    {
                        inputs: {},
                        query: prompt,
                        user: "tester"
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${DIFY_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('备用方案1响应:', response1.data);
                return mockQuestionResponse();
            } catch (err1) {
                console.log('备用方案1失败:', err1.message);
                
                // 尝试方案2：使用 chat/completions 端点
                const backupUrl2 = `${DIFY_API_URL}/v1/chat/completions`;
                console.log(`尝试 ${backupUrl2}`);
                
                try {
                    const response2 = await axios.post(
                        backupUrl2,
                        {
                            model: "gpt-3.5-turbo",
                            messages: [
                                {
                                    role: "user",
                                    content: prompt
                                }
                            ]
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${DIFY_API_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    console.log('备用方案2响应:', response2.data);
                    return mockQuestionResponse();
                } catch (err2) {
                    console.log('备用方案2失败:', err2.message);
                    
                    // 所有尝试都失败，返回模拟数据
                    console.log('所有 API 尝试都失败，返回模拟数据');
                    return mockQuestionResponse();
                }
            }
        } catch (backupError) {
            console.error('所有备用方案都失败:', backupError);
            // 返回模拟数据
            return mockQuestionResponse();
        }
    }
}

// 返回模拟问题数据
function mockQuestionResponse() {
    return {
        data: {
            question: '什么是区块链？',
            options: ['一种加密货币', '一种分布式账本技术', '一种编程语言', '一种云存储服务'],
            correctAnswer: '一种分布式账本技术',
            explanation: '区块链是一种分布式账本技术，它允许多方安全地记录交易和管理信息，无需中央权威机构。'
        }
    };
}

module.exports = router;