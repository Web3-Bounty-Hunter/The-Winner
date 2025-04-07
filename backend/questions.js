const express = require('express');
const axios = require('axios');
const { DIFY_API_KEY, DIFY_API_URL } = require('./config');
const { db, getQuestionCategories, getUserById, incrementQuestionWeight, getQuestionsByCourseId } = require('./database');
const { authenticateToken } = require('./coins');

const router = express.Router();

// 获取权重较低的题目
async function getQuestionsWithLowWeight(topic, difficulty, count) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM questions 
       WHERE topic = ? AND difficulty = ? 
       ORDER BY weight ASC 
       LIMIT ?`,
      [topic, difficulty, count],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 更新被选中题目的权重
        rows.forEach(question => {
          db.run(
            'UPDATE questions SET weight = weight + 1 WHERE id = ?',
            [question.id]
          );
        });
        
        resolve(rows);
      }
    );
  });
}

// 获取题目
router.get('/', async (req, res) => {
  const { courseId, topic, difficulty, count = 10 } = req.query;
  
  // --- 添加日志 ---
  console.log(`[${new Date().toISOString()}] Received /api/questions request:`);
  console.log(`  Raw query object:`, req.query); // 打印原始 query 对象
  console.log(`  Parsed topic: '${topic}' (Type: ${typeof topic})`);
  console.log(`  Parsed difficulty: '${difficulty}' (Type: ${typeof difficulty})`);
  console.log(`  Parsed count: ${count} (Type: ${typeof count})`);
  // --- 日志结束 ---

  if (!topic || !difficulty) {
    return res.status(400).json({ error: '缺少必要参数: topic 和 difficulty' });
  }
  
  try {
    let questions;
    if (courseId) {
      // 根据课程ID获取题目
      questions = await getQuestionsByCourseId(courseId);
    } else {
      // 使用现有的获取逻辑
      questions = await getQuestionsWithLowWeight(topic, difficulty, parseInt(count, 10));
    }
    
    // 格式化题目数据
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      question: q.text || q.question,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      source: q.source,
      difficulty: q.difficulty,
      topic: q.topic,
      courseId: q.courseId,
      isMultipleChoice: q.isMultipleChoice,
      tokenReward: q.tokenReward || 10,
      title: q.title
    }));
    
    res.json(formattedQuestions);
  } catch (error) {
    console.error('获取题目失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取题目类别和难度级别
router.get('/categories', async (req, res) => {
  try {
    const categories = await getQuestionCategories();
    res.json(categories);
  } catch (error) {
    console.error('获取题目类别失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 生成并添加题目 (需要管理员权限)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { topic, difficulty, testMode } = req.body;
    
    // 检查用户是否有管理员权限
    const user = await getUserById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '没有权限执行此操作' });
    }

    // 测试模式返回模拟数据
    if (testMode) {
      const mockQuestion = {
        text: '什么是区块链？',
        options: JSON.stringify(['一种加密货币', '一种分布式账本技术', '一种编程语言', '一种云存储服务']),
        correctAnswer: '一种分布式账本技术',
        explanation: '区块链是一种分布式账本技术，它允许多方安全地记录交易和管理信息，无需中央权威机构。',
        source: '模拟数据',
        territoryId: topic || 'blockchain-basics',
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
            id: this.lastID
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
    
    // 解析响应数据
    // 注意：实际实现中需要根据Dify API的响应格式进行解析
    // 这里使用模拟数据
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
    // 返回模拟数据
    return mockQuestionResponse();
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

// 添加获取单个题目的路由
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const question = await db.get('SELECT * FROM questions WHERE id = ?', [id]);
    
    if (!question) {
      return res.status(404).json({ error: '题目未找到' });
    }
    
    // 格式化题目数据
    const formattedQuestion = {
      id: question.id,
      question: question.text || question.question,
      options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      source: question.source,
      difficulty: question.difficulty,
      topic: question.topic,
      courseId: question.courseId,
      isMultipleChoice: question.isMultipleChoice,
      tokenReward: question.tokenReward || 10,
      title: question.title
    };
    
    res.json(formattedQuestion);
  } catch (error) {
    console.error('获取题目失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取下一题
router.get('/next', async (req, res) => {
  const { courseId, currentId } = req.query;
  
  try {
    // 获取课程的所有题目
    const questions = await getQuestionsByCourseId(courseId);
    
    // 找到当前题目的索引
    const currentIndex = questions.findIndex(q => q.id === parseInt(currentId, 10));
    
    // 如果有下一题，返回下一题
    if (currentIndex < questions.length - 1) {
      const nextQuestion = questions[currentIndex + 1];
      res.json({
        id: nextQuestion.id,
        courseId: nextQuestion.courseId
      });
    } else {
      // 没有下一题
      res.status(404).json({ message: '课程已完成' });
    }
  } catch (error) {
    console.error('获取下一题失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;