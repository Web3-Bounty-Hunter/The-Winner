const express = require('express');
const jwt = require('jsonwebtoken');
const { 
  getUserById, 
  updateUserCoins, 
  recordTransaction 
} = require('./database');
const { JWT_SECRET } = require('./config');

const router = express.Router();

// 验证JWT中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
}

// 获取用户金币余额
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ coins: user.coins });
  } catch (error) {
    console.error('获取金币余额失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 增加或减少金币（内部API，不直接暴露给前端）
async function updateCoins(userId, amount, type, description) {
  try {
    // 更新用户金币
    await updateUserCoins(userId, amount);
    
    // 记录交易
    await recordTransaction(userId, amount, type, description);
    
    // 获取更新后的用户信息
    const updatedUser = await getUserById(userId);
    
    return {
      success: true,
      coins: updatedUser.coins
    };
  } catch (error) {
    console.error('更新金币失败:', error);
    throw error;
  }
}

module.exports = {
  router,
  updateCoins,
  authenticateToken
};