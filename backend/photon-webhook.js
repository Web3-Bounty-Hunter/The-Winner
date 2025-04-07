const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Photon Cloud Webhook 密钥
const PHOTON_SECRET = process.env.PHOTON_SECRET || 'your_default_photon_secret_key';

// 验证 Photon 请求
function verifyPhotonRequest(req, res, next) {
  const signature = req.headers['x-photon-signature'];
  if (!signature) {
    return res.status(401).json({ error: '缺少签名' });
  }

  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha1', PHOTON_SECRET);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('hex');

  if (calculatedSignature !== signature) {
    return res.status(401).json({ error: '签名无效' });
  }

  next();
}

// Photon Webhook 路由
router.post('/webhook', verifyPhotonRequest, (req, res) => {
  const { Type, AppId, AppVersion, Region, UserId, GameId } = req.body;
  
  console.log(`收到 Photon Webhook 请求: ${Type}`);
  
  // 根据不同的事件类型处理
  switch (Type) {
    case 'CreateGame':
      // 处理创建游戏
      handleCreateGame(req.body, res);
      break;
      
    case 'JoinGame':
      // 处理加入游戏
      handleJoinGame(req.body, res);
      break;
      
    case 'LeaveGame':
      // 处理离开游戏
      handleLeaveGame(req.body, res);
      break;
      
    case 'CloseGame':
      // 处理关闭游戏
      handleCloseGame(req.body, res);
      break;
      
    case 'Event':
      // 处理自定义事件
      handleEvent(req.body, res);
      break;
      
    default:
      res.json({ ResultCode: 0 });
  }
});

// 处理创建游戏
function handleCreateGame(data, res) {
  const { UserId, GameProperties } = data;
  
  // 验证游戏属性
  if (!GameProperties || !GameProperties.roomName) {
    return res.json({ 
      ResultCode: 2, // 拒绝
      Message: '缺少必要的房间属性'
    });
  }
  
  // 在这里可以添加更多的验证逻辑
  // 例如检查用户是否有足够的金币创建房间
  
  // 返回成功
  res.json({ 
    ResultCode: 0, // 允许
    GameProperties: {
      ...GameProperties,
      createdAt: new Date().toISOString(),
      status: 'waiting'
    }
  });
}

// 处理加入游戏
function handleJoinGame(data, res) {
  const { UserId, GameId, GameProperties, ActorNr } = data;
  
  // 检查游戏是否已满
  if (GameProperties.playerCount >= GameProperties.maxPlayers) {
    return res.json({ 
      ResultCode: 2, // 拒绝
      Message: '房间已满'
    });
  }
  
  // 检查游戏是否需要密码
  if (GameProperties.hasPassword && !data.JoinToken) {
    return res.json({ 
      ResultCode: 2, // 拒绝
      Message: '需要密码'
    });
  }
  
  // 如果有密码，验证密码
  if (GameProperties.hasPassword && data.JoinToken !== GameProperties.password) {
    return res.json({ 
      ResultCode: 2, // 拒绝
      Message: '密码错误'
    });
  }
  
  // 返回成功
  res.json({ ResultCode: 0 }); // 允许
}

// 处理自定义事件
function handleEvent(data, res) {
  const { UserId, GameId, EventCode, Data } = data;
  
  // 根据事件代码处理不同的游戏逻辑
  switch (EventCode) {
    case PhotonEventCode.START_GAME:
      // 处理开始游戏
      handleStartGame(UserId, GameId, Data, res);
      break;
      
    case PhotonEventCode.ANSWER:
      // 处理答案提交
      handleAnswer(UserId, GameId, Data, res);
      break;
      
    case PhotonEventCode.CARD_SELECTED:
      // 处理卡牌选择
      handleCardSelected(UserId, GameId, Data, res);
      break;
      
    default:
      // 默认允许事件
      res.json({ ResultCode: 0 });
  }
}

// 处理开始游戏
function handleStartGame(userId, gameId, data, res) {
  // 在这里实现开始游戏的逻辑
  // 例如生成卡牌、设置初始状态等
  
  // 返回游戏初始状态
  res.json({
    ResultCode: 0,
    Data: {
      gameState: 'playing',
      cards: generateCards(),
      communityCards: generateCommunityCards(),
      pot: data.buyIn * 0.2 * data.playerCount
    }
  });
}

// 生成卡牌
function generateCards() {
  // 实现卡牌生成逻辑
  const difficulties = ["easy", "easy", "medium", "hard", "extreme"];
  return difficulties.map((difficulty, index) => ({
    id: index,
    difficulty,
    revealed: false,
    selected: false,
    burned: false
  }));
}

// 生成公共牌
function generateCommunityCards() {
  return [
    { id: 100, difficulty: "medium", revealed: false, selected: false, burned: false },
    { id: 101, difficulty: "medium", revealed: false, selected: false, burned: false },
    { id: 102, difficulty: "medium", revealed: false, selected: false, burned: false },
    { id: 103, difficulty: "hard", revealed: false, selected: false, burned: false },
    { id: 104, difficulty: "hard", revealed: false, selected: false, burned: false }
  ];
}

module.exports = router; 