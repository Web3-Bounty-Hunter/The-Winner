const express = require('express');
const router = express.Router();
const { getUserById, updateUserCoins } = require('../database');
const { authenticateToken } = require('./auth');

// 获取用户信息
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 验证用户ID
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的用户ID' 
      });
    }
    
    // 获取用户信息
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: '用户不存在' 
      });
    }
    
    // 返回用户信息
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name || user.username,
        coins: user.coins || 0
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取用户信息失败，请稍后再试' 
    });
  }
});

// 更新用户金币
router.post('/:id/coins', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { amount, description } = req.body;
    
    // 验证用户ID
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的用户ID' 
      });
    }
    
    // 验证金币数量
    if (isNaN(amount) || amount === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的金币数量' 
      });
    }
    
    // 验证用户权限
    if (req.user.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: '没有权限修改其他用户的金币' 
      });
    }
    
    // 更新用户金币
    const result = await updateUserCoins(userId, amount, description || '系统操作');
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error || '更新金币失败' 
      });
    }
    
    // 获取更新后的用户信息
    const user = await getUserById(userId);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name || user.username,
        coins: user.coins || 0
      }
    });
  } catch (error) {
    console.error('更新用户金币失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新用户金币失败，请稍后再试' 
    });
  }
});

module.exports = router; 