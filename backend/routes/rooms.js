const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { 
  createRoomInDB, 
  getRoomFromDB, 
  getAllRoomsFromDB,
  addPlayerToRoomInDB,
  removePlayerFromRoomInDB,
  updateRoomStatusInDB
} = require('../database');
const { authenticateToken } = require('./auth');

// 创建房间
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, maxPlayers, isPrivate, password, options } = req.body;
    const userId = req.user.userId;
    
    // 验证房间名称
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: '房间名称不能为空' 
      });
    }
    
    // 生成房间ID
    const roomId = uuidv4();
    
    // 创建房间
    const result = await createRoomInDB({
      id: roomId,
      name,
      host: userId,
      maxPlayers: maxPlayers || 6,
      isPrivate: isPrivate || false,
      password: password || null,
      options: options || {}
    });
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error || '创建房间失败' 
      });
    }
    
    // 将创建者添加到房间
    await addPlayerToRoomInDB(roomId, userId);
    
    // 获取创建的房间
    const room = await getRoomFromDB(roomId);
    
    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('创建房间失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '创建房间失败，请稍后再试' 
    });
  }
});

// 获取所有房间
router.get('/', async (req, res) => {
  try {
    const rooms = await getAllRoomsFromDB();
    
    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('获取房间列表失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取房间列表失败，请稍后再试' 
    });
  }
});

// 获取房间详情
router.get('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    
    // 获取房间信息
    const room = await getRoomFromDB(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        error: '房间不存在' 
      });
    }
    
    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('获取房间详情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取房间详情失败，请稍后再试' 
    });
  }
});

// 加入房间
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.userId;
    const { password } = req.body;
    
    // 获取房间信息
    const room = await getRoomFromDB(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        error: '房间不存在' 
      });
    }
    
    // 检查房间状态
    if (room.status !== 'waiting') {
      return res.status(400).json({ 
        success: false, 
        error: '房间已开始游戏，无法加入' 
      });
    }
    
    // 检查房间是否已满
    if (room.players.length >= room.max_players) {
      return res.status(400).json({ 
        success: false, 
        error: '房间已满' 
      });
    }
    
    // 检查是否已在房间中
    if (room.players.some(player => player.id === userId)) {
      return res.status(400).json({ 
        success: false, 
        error: '您已在房间中' 
      });
    }
    
    // 检查密码
    if (room.is_private && room.password !== password) {
      return res.status(401).json({ 
        success: false, 
        error: '密码错误' 
      });
    }
    
    // 加入房间
    const result = await addPlayerToRoomInDB(roomId, userId);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error || '加入房间失败' 
      });
    }
    
    // 获取更新后的房间信息
    const updatedRoom = await getRoomFromDB(roomId);
    
    res.json({
      success: true,
      room: updatedRoom
    });
  } catch (error) {
    console.error('加入房间失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '加入房间失败，请稍后再试' 
    });
  }
});

// 离开房间
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const roomId = req.params.id;
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
      return res.status(400).json({ 
        success: false, 
        error: '您不在房间中' 
      });
    }
    
    // 离开房间
    const result = await removePlayerFromRoomInDB(roomId, userId);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error || '离开房间失败' 
      });
    }
    
    // 获取更新后的房间信息
    const updatedRoom = await getRoomFromDB(roomId);
    
    // 如果房间没有玩家，删除房间
    if (updatedRoom && updatedRoom.players.length === 0) {
      // 这里可以添加删除房间的逻辑
      // 暂时不实现
    }
    // 如果房主离开，转移房主
    else if (updatedRoom && room.host === userId && updatedRoom.players.length > 0) {
      // 这里可以添加转移房主的逻辑
      // 暂时不实现
    }
    
    res.json({
      success: true,
      room: updatedRoom
    });
  } catch (error) {
    console.error('离开房间失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '离开房间失败，请稍后再试' 
    });
  }
});

// 更新房间状态
router.post('/:id/status', authenticateToken, async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.userId;
    const { status } = req.body;
    
    // 验证状态
    if (!status || !['waiting', 'playing', 'finished'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的房间状态' 
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
        error: '只有房主可以更新房间状态' 
      });
    }
    
    // 更新房间状态
    const result = await updateRoomStatusInDB(roomId, status);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error || '更新房间状态失败' 
      });
    }
    
    // 获取更新后的房间信息
    const updatedRoom = await getRoomFromDB(roomId);
    
    res.json({
      success: true,
      room: updatedRoom
    });
  } catch (error) {
    console.error('更新房间状态失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新房间状态失败，请稍后再试' 
    });
  }
});

module.exports = router; 