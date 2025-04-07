const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { 
  getUserByUsername, 
  getUserById, 
  createUser 
} = require('../database');

// 在文件顶部添加默认密钥
const DEFAULT_JWT_SECRET = 'your_default_jwt_secret_key';
const DEFAULT_PHOTON_SECRET = 'your_default_photon_secret_key';

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '用户名和密码不能为空' 
      });
    }
    
    // 查找用户
    const user = await getUserByUsername(username);
    
    // 调试信息
    console.log(`尝试登录用户: ${username}`);
    console.log(`用户存在: ${!!user}`);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: '用户名或密码错误' 
      });
    }
    
    // 确保密码字段存在且不为空
    if (!user.password) {
      console.error(`用户 ${username} 的密码字段为空`);
      return res.status(401).json({ 
        success: false, 
        error: '账户数据异常，请联系管理员' 
      });
    }
    
    // 比较密码
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ 
        success: false, 
        error: '用户名或密码错误' 
      });
    }
    
    // 生成 JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '登录失败，请稍后再试' 
    });
  }
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    
    console.log(`尝试注册用户: ${username}`);
    
    // 验证请求数据
    if (!username || !password) {
      console.log('注册失败: 用户名或密码为空');
      return res.status(400).json({ 
        success: false, 
        error: '用户名和密码不能为空' 
      });
    }
    
    // 检查用户名是否已存在
    console.log(`检查用户名 ${username} 是否存在...`);
    const existingUser = await getUserByUsername(username);
    
    console.log(`用户名 ${username} 存在检查结果:`, existingUser);
    
    if (existingUser) {
      console.log(`用户名 ${username} 已存在，注册失败`);
      return res.status(409).json({ 
        success: false, 
        error: '用户名已存在' 
      });
    }
    
    // 加密密码
    console.log('加密密码...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 创建新用户
    console.log(`创建新用户: ${username}`);
    const result = await createUser({
      username,
      password: hashedPassword,
      displayName
    });
    
    console.log(`创建用户结果:`, result);
    
    if (!result.success) {
      console.log(`创建用户 ${username} 失败:`, result.error);
      return res.status(500).json({ 
        success: false, 
        error: result.error || '创建用户失败' 
      });
    }
    
    const userId = result.userId;
    console.log(`用户 ${username} 创建成功，ID: ${userId}`);
    
    // 获取新创建的用户
    const user = await getUserById(userId);
    
    // 创建 JWT 令牌
    const token = jwt.sign(
      { 
        userId, 
        username 
      },
      process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 返回用户信息和令牌
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name || user.username,
        coins: user.coins || 0
      },
      token
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '注册失败，请稍后再试' 
    });
  }
});

// 验证令牌中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: '未提供认证令牌' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || DEFAULT_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: '无效或过期的令牌' 
    });
  }
};

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 从数据库获取最新的用户信息
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

module.exports = {
  router,
  authenticateToken
}; 