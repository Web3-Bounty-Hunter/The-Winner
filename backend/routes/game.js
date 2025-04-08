const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  getQuestionsByDifficulty,
  updateUserCoins,
  recordGameResult,
  getRoomFromDB,
  storeGameDataInDB,
  getGameDataFromDB,
  updateGameDataInDB,
  getRandomQuestion
} = require('../database');

// 获取问题
router.get('/questions', authenticateToken, async (req, res) => {
  try {
    const { difficulty, count } = req.query;
    
    if (!difficulty) {
      return res.status(400).json({ success: false, error: '难度参数不能为空' });
    }
    
    const questions = await getQuestionsByDifficulty(
      difficulty, 
      count ? parseInt(count) : 10
    );
    
    res.json({ success: true, questions });
  } catch (error) {
    console.error('获取问题失败:', error);
    res.status(500).json({ success: false, error: '获取问题失败' });
  }
});

// 验证答案
router.post('/verify-answer', authenticateToken, async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    
    if (!questionId || !answer) {
      return res.status(400).json({ success: false, error: '问题ID和答案不能为空' });
    }
    
    // 从数据库获取问题
    const [question] = await pool.execute(
      'SELECT * FROM questions WHERE id = ?',
      [questionId]
    );
    
    if (!question || question.length === 0) {
      return res.status(404).json({ success: false, error: '问题不存在' });
    }
    
    // 验证答案
    const isCorrect = question[0].answer.toLowerCase() === answer.toLowerCase();
    
    res.json({ success: true, correct: isCorrect });
  } catch (error) {
    console.error('验证答案失败:', error);
    res.status(500).json({ success: false, error: '验证答案失败' });
  }
});

// 记录游戏结果
router.post('/record-result', authenticateToken, async (req, res) => {
  try {
    const { roomId, results } = req.body;
    
    if (!roomId || !results) {
      return res.status(400).json({ success: false, error: '房间ID和结果不能为空' });
    }
    
    // 记录游戏结果
    const result = await recordGameResult(roomId, 'poker', results);
    
    // 更新玩家金币
    for (const [playerId, playerResult] of Object.entries(results)) {
      if (playerResult.coinsChange) {
        await updateUserCoins(
          playerId, 
          playerResult.coinsChange, 
          `德州扑克游戏 ${roomId}`
        );
      }
    }
    
    res.json({ success: true, gameId: result.gameId });
  } catch (error) {
    console.error('记录游戏结果失败:', error);
    res.status(500).json({ success: false, error: '记录游戏结果失败' });
  }
});

// 开始游戏
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.userId;
    
    // 验证房间ID
    if (!roomId) {
      return res.status(400).json({ 
        success: false, 
        error: '房间ID不能为空' 
      });
    }
    
    // 获取房间信息
    const room = await getRoomFromDB(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        error: '房间不存在' 
      });
    }
    
    // 检查权限
    if (room.host !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: '只有房主可以开始游戏' 
      });
    }
    
    // 检查房间状态
    if (room.status !== 'waiting') {
      return res.status(400).json({ 
        success: false, 
        error: '房间已开始游戏' 
      });
    }
    
    // 检查玩家数量
    if (room.players.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: '至少需要2名玩家才能开始游戏' 
      });
    }
    
    // 创建游戏数据
    const gameData = {
      roomId,
      players: room.players.map(player => ({
        id: player.id,
        username: player.username,
        displayName: player.display_name || player.username,
        coins: player.coins || 0,
        cards: [],
        bet: 0,
        folded: false,
        ready: false
      })),
      currentRound: 0,
      currentTurn: 0,
      pot: 0,
      communityCards: [],
      deck: [],
      status: 'waiting',
      startTime: new Date().toISOString()
    };
    
    // 存储游戏数据
    const result = await storeGameDataInDB(roomId, gameData);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error || '创建游戏失败' 
      });
    }
    
    res.json({
      success: true,
      gameId: result.gameId,
      gameData
    });
  } catch (error) {
    console.error('开始游戏失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '开始游戏失败，请稍后再试' 
    });
  }
});

// 获取游戏数据
router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user.userId;
    
    // 获取房间信息
    const room = await getRoomFromDB(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        error: '房间不存在' 
      });
    }
    
    // 检查是否在房间中
    if (!room.players.some(player => player.id === userId)) {
      return res.status(403).json({ 
        success: false, 
        error: '您不在房间中' 
      });
    }
    
    // 获取游戏数据
    const gameData = await getGameDataFromDB(roomId);
    
    if (!gameData) {
      return res.status(404).json({ 
        success: false, 
        error: '游戏不存在' 
      });
    }
    
    res.json({
      success: true,
      gameData
    });
  } catch (error) {
    console.error('获取游戏数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取游戏数据失败，请稍后再试' 
    });
  }
});

// 获取随机问题
router.get('/question/random', async (req, res) => {
  try {
    const { difficulty } = req.query;
    
    // 验证难度
    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的难度' 
      });
    }
    
    // 获取随机问题
    const question = await getRandomQuestion(difficulty);
    
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: '没有找到符合条件的问题' 
      });
    }
    
    res.json({
      success: true,
      question: {
        id: question.id,
        content: question.content,
        options: question.options,
        difficulty: question.difficulty,
        category: question.category
      }
    });
  } catch (error) {
    console.error('获取随机问题失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取随机问题失败，请稍后再试' 
    });
  }
});

// 提交答案
router.post('/question/:id/answer', authenticateToken, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const { answer } = req.body;
    
    // 验证问题ID
    if (isNaN(questionId)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的问题ID' 
      });
    }
    
    // 验证答案
    if (!answer) {
      return res.status(400).json({ 
        success: false, 
        error: '答案不能为空' 
      });
    }
    
    // 获取问题
    const question = await db.getAsync(
      'SELECT * FROM questions WHERE id = ?',
      [questionId]
    );
    
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: '问题不存在' 
      });
    }
    
    // 检查答案
    const isCorrect = answer === question.correct_answer;
    
    res.json({
      success: true,
      isCorrect,
      correctAnswer: question.correct_answer
    });
  } catch (error) {
    console.error('提交答案失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '提交答案失败，请稍后再试' 
    });
  }
});

module.exports = router; 