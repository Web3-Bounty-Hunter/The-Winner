const { v4: uuidv4 } = require('uuid');
const { getQuestionsByDifficulty, updateUserCoins } = require('./database');

// 存储房间和玩家信息
const rooms = {};
const players = {};

// 扑克牌相关常量
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'extreme'];

// 扑克牌类
class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.visible = false;
    this.difficulty = null;
    this.question = null;
  }
  
  getValue() {
    const rankValues = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return rankValues[this.rank];
  }
}

// 牌组类
class Deck {
  constructor() {
    this.cards = [];
    this.initDeck();
  }
  
  initDeck() {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push(new Card(suit, rank));
      }
    }
  }
  
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  
  dealCard() {
    return this.cards.pop();
  }
}

// 生成房间ID
function generateRoomId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 创建房间
function createRoom(options) {
  console.log("gameLogic.createRoom 被调用，参数:", JSON.stringify(options, null, 2));
  
  const { host: hostId, name, maxPlayers = 6, isPrivate = false, password, gameType = 'quiz', options: gameOptions } = options || {};
  
  console.log("解构后的参数:", {
    hostId,
    name,
    maxPlayers,
    isPrivate,
    password,
    gameType,
    gameOptions
  });
  
  if (!hostId) {
    console.error("创建房间失败: 缺少房主ID");
    return { success: false, error: '缺少房主ID' };
  }
  
  if (!name) {
    console.error("创建房间失败: 缺少房间名称");
    return { success: false, error: '缺少房间名称' };
  }
  
  // 生成唯一房间ID
  const roomId = uuidv4();
  console.log(`生成房间ID: ${roomId}`);
  
  // 创建房间对象
  rooms[roomId] = {
    id: roomId,
    name,
    host: hostId,
    players: [hostId],
    maxPlayers: maxPlayers,
    isPrivate: isPrivate,
    password: password,
    status: 'waiting',
    createdAt: new Date().toISOString(),
    gameType: gameType,
    options: gameOptions || {},
    playerStatus: {
      [hostId]: {
        ready: false,
        score: 0
      }
    }
  };
  
  console.log(`房间 ${roomId} 创建成功:`, JSON.stringify(rooms[roomId], null, 2));
  return { success: true, room: rooms[roomId] };
}

// 加入房间
function joinRoom(userId, roomId, password) {
  try {
    console.log(`用户 ${userId} 尝试加入房间 ${roomId}`);
    
    // 检查房间是否存在
    const room = rooms[roomId];
    if (!room) {
      return { success: false, error: "房间不存在" };
    }
    
    // 检查房间状态
    if (room.status !== 'waiting') {
      return { success: false, error: "游戏已经开始或已结束" };
    }
    
    // 检查房间是否已满
    if (room.players.length >= room.maxPlayers) {
      return { success: false, error: "房间已满" };
    }
    
    // 检查玩家是否已在房间中
    if (room.players.includes(userId)) {
      return { success: false, error: "您已经在房间中" };
    }
    
    // 检查私人房间密码
    if (room.isPrivate && room.password !== password) {
      return { success: false, error: "密码错误" };
    }
    
    // 将玩家添加到房间
    room.players.push(userId);
    
    // 更新玩家信息
    if (!players[userId]) {
      players[userId] = { roomId };
    } else {
      players[userId].roomId = roomId;
    }
    
    console.log(`用户 ${userId} 成功加入房间 ${roomId}`);
    
    return { success: true, room };
  } catch (error) {
    console.error('加入房间失败:', error);
    return { success: false, error: error.message };
  }
}

// 离开房间
function leaveRoom(userId) {
  try {
    console.log(`用户 ${userId} 尝试离开房间`);
    
    // 检查玩家是否在房间中
    if (!players[userId] || !players[userId].roomId) {
      return { success: false, error: "您不在任何房间中" };
    }
    
    const roomId = players[userId].roomId;
    const room = rooms[roomId];
    
    if (!room) {
      // 房间不存在，清理玩家信息
      delete players[userId].roomId;
      return { success: true };
    }
    
    // 从房间中移除玩家
    const playerIndex = room.players.indexOf(userId);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
    }
    
    // 清理玩家信息
    delete players[userId].roomId;
    
    // 即使房间为空，也保留房间
    if (room.players.length === 0) {
      console.log(`房间 ${roomId} 现在没有玩家，但保持存在`);
    }
    
    // 如果离开的是房主，转移房主权限
    if (room.host === userId && room.players.length > 0) {
      room.host = room.players[0];
      console.log(`房间 ${roomId} 的房主已转移给用户 ${room.host}`);
    }
    
    console.log(`用户 ${userId} 成功离开房间 ${roomId}`);
    
    return { success: true, room, roomDeleted: false };
  } catch (error) {
    console.error('离开房间失败:', error);
    return { success: false, error: error.message };
  }
}

// 开始游戏
async function startGame(roomId) {
  try {
    console.log(`尝试开始房间 ${roomId} 的游戏`);
    
    const room = rooms[roomId];
    if (!room) {
      return { success: false, error: "房间不存在" };
    }
    
    if (room.status !== 'waiting') {
      return { success: false, error: "游戏已经开始或已结束" };
    }
    
    if (room.players.length < 2) {
      return { success: false, error: "至少需要2名玩家才能开始游戏" };
    }
    
    // 更新房间状态
    room.status = 'playing';
    
    // 初始化扑克游戏
    const pokerGame = {
      deck: new Deck(),
      communityCards: [],
      playerCards: {},
      pot: 0,
      currentPlayer: 0,
      dealerPosition: 0,
      smallBlindPosition: 0,
      bigBlindPosition: 0,
      round: 'pre-flop',
      minBet: room.options.blinds[1],
      bets: {},
      playerStates: {},
      questions: {}
    };
    
    // 洗牌
    pokerGame.deck.shuffle();
    
    // 设置玩家状态
    room.players.forEach((playerId, index) => {
      pokerGame.playerCards[playerId] = {
        holeCards: [],
        specialCards: []
      };
      
      pokerGame.playerStates[playerId] = {
        chips: room.options.buyIn,
        bet: 0,
        totalBet: 0,
        folded: false,
        allIn: false,
        isActive: true
      };
    });
    
    // 设置位置
    const playerCount = room.players.length;
    pokerGame.dealerPosition = Math.floor(Math.random() * playerCount);
    pokerGame.smallBlindPosition = (pokerGame.dealerPosition + 1) % playerCount;
    pokerGame.bigBlindPosition = (pokerGame.dealerPosition + 2) % playerCount;
    pokerGame.currentPlayer = (pokerGame.bigBlindPosition + 1) % playerCount;
    
    // 收取盲注
    const smallBlindPlayer = room.players[pokerGame.smallBlindPosition];
    const bigBlindPlayer = room.players[pokerGame.bigBlindPosition];
    
    pokerGame.playerStates[smallBlindPlayer].bet = room.options.blinds[0];
    pokerGame.playerStates[smallBlindPlayer].totalBet = room.options.blinds[0];
    pokerGame.playerStates[smallBlindPlayer].chips -= room.options.blinds[0];
    
    pokerGame.playerStates[bigBlindPlayer].bet = room.options.blinds[1];
    pokerGame.playerStates[bigBlindPlayer].totalBet = room.options.blinds[1];
    pokerGame.playerStates[bigBlindPlayer].chips -= room.options.blinds[1];
    
    pokerGame.pot = room.options.blinds[0] + room.options.blinds[1];
    
    // 加载问题
    try {
      pokerGame.questions.easy = await getQuestionsByDifficulty('easy', 20);
      pokerGame.questions.medium = await getQuestionsByDifficulty('medium', 20);
      pokerGame.questions.hard = await getQuestionsByDifficulty('hard', 20);
      pokerGame.questions.extreme = await getQuestionsByDifficulty('extreme', 20);
    } catch (error) {
      console.error('加载问题失败:', error);
      // 使用默认问题
      pokerGame.questions = {
        easy: [
          { id: 1, question: "比特币的创始人是谁？", options: ["中本聪", "马斯克", "比尔盖茨", "扎克伯格"], answer: "中本聪" },
          { id: 2, question: "以太坊的代币符号是什么？", options: ["BTC", "ETH", "USDT", "BNB"], answer: "ETH" }
        ],
        medium: [
          { id: 3, question: "什么是区块链？", options: ["一种数据库", "一种分布式账本", "一种加密货币", "一种支付方式"], answer: "一种分布式账本" },
          { id: 4, question: "比特币的总供应量是多少？", options: ["1000万", "2100万", "1亿", "无限"], answer: "2100万" }
        ],
        hard: [
          { id: 5, question: "什么是智能合约？", options: ["一种法律合同", "一种自动执行的程序", "一种交易方式", "一种加密算法"], answer: "一种自动执行的程序" },
          { id: 6, question: "以太坊使用的共识机制是什么？", options: ["PoW", "PoS", "DPoS", "PoA"], answer: "PoS" }
        ],
        extreme: [
          { id: 7, question: "什么是零知识证明？", options: ["一种不泄露任何信息的证明方式", "一种加密算法", "一种区块链协议", "一种交易方式"], answer: "一种不泄露任何信息的证明方式" },
          { id: 8, question: "比特币的区块大小限制是多少？", options: ["1MB", "2MB", "4MB", "8MB"], answer: "1MB" }
        ]
      };
    }
    
    // 发底牌
    for (let i = 0; i < 2; i++) {
      for (const playerId of room.players) {
        const card = pokerGame.deck.dealCard();
        card.visible = true; // 底牌对玩家可见
        pokerGame.playerCards[playerId].holeCards.push(card);
      }
    }
    
    // 发特殊牌
    for (const playerId of room.players) {
      // 2张简单难度牌
      for (let i = 0; i < 2; i++) {
        const card = pokerGame.deck.dealCard();
        const questions = pokerGame.questions.easy;
        const question = questions[Math.floor(Math.random() * questions.length)];
        card.difficulty = 'easy';
        card.question = question;
        pokerGame.playerCards[playerId].specialCards.push(card);
      }
      
      // 1张中等难度牌
      const mediumCard = pokerGame.deck.dealCard();
      const mediumQuestions = pokerGame.questions.medium;
      const mediumQuestion = mediumQuestions[Math.floor(Math.random() * mediumQuestions.length)];
      mediumCard.difficulty = 'medium';
      mediumCard.question = mediumQuestion;
      pokerGame.playerCards[playerId].specialCards.push(mediumCard);
      
      // 1张高等难度牌
      const hardCard = pokerGame.deck.dealCard();
      const hardQuestions = pokerGame.questions.hard;
      const hardQuestion = hardQuestions[Math.floor(Math.random() * hardQuestions.length)];
      hardCard.difficulty = 'hard';
      hardCard.question = hardQuestion;
      pokerGame.playerCards[playerId].specialCards.push(hardCard);
      
      // 1张地狱难度牌
      const extremeCard = pokerGame.deck.dealCard();
      const extremeQuestions = pokerGame.questions.extreme;
      const extremeQuestion = extremeQuestions[Math.floor(Math.random() * extremeQuestions.length)];
      extremeCard.difficulty = 'extreme';
      extremeCard.question = extremeQuestion;
      pokerGame.playerCards[playerId].specialCards.push(extremeCard);
    }
    
    // 保存游戏状态
    room.game = pokerGame;
    
    console.log(`房间 ${roomId} 的游戏已开始`);
    
    return { success: true };
  } catch (error) {
    console.error('开始游戏失败:', error);
    return { success: false, error: error.message };
  }
}

// 处理游戏操作
function handleGameAction(roomId, playerId, action, data) {
  try {
    console.log(`用户 ${playerId} 在房间 ${roomId} 执行操作: ${action}`);
    
    const room = rooms[roomId];
    if (!room) {
      return { success: false, error: "房间不存在" };
    }
    
    if (room.status !== 'playing') {
      return { success: false, error: "游戏尚未开始或已结束" };
    }
    
    const game = room.game;
    if (!game) {
      return { success: false, error: "游戏状态不存在" };
    }
    
    // 检查是否是当前玩家的回合
    const currentPlayerIndex = game.currentPlayer;
    const currentPlayerId = room.players[currentPlayerIndex];
    
    // 特殊操作不需要检查当前玩家
    if (action !== 'answer_question' && playerId !== currentPlayerId) {
      return { success: false, error: "不是您的回合" };
    }
    
    // 根据操作类型处理
    switch (action) {
      case 'fold':
        return handleFold(room, playerId);
      
      case 'check':
        return handleCheck(room, playerId);
      
      case 'call':
        return handleCall(room, playerId);
      
      case 'bet':
        return handleBet(room, playerId, data.amount);
      
      case 'raise':
        return handleRaise(room, playerId, data.amount);
      
      case 'answer_question':
        return handleAnswerQuestion(room, playerId, data.cardIndex, data.answer);
      
      case 'select_cards':
        return handleSelectCards(room, playerId, data.selectedCards);
      
      default:
        return { success: false, error: `未知的操作: ${action}` };
    }
  } catch (error) {
    console.error('处理游戏操作失败:', error);
    return { success: false, error: error.message };
  }
}

// 处理弃牌
function handleFold(room, playerId) {
  try {
    const game = room.game;
    const playerState = game.playerStates[playerId];
    
    // 标记玩家弃牌
    playerState.folded = true;
    playerState.isActive = false;
    
    // 移动到下一个玩家
    const nextPlayer = getNextActivePlayer(room);
    game.currentPlayer = room.players.indexOf(nextPlayer);
    
    // 检查是否只剩一个玩家
    const activePlayers = room.players.filter(id => game.playerStates[id].isActive);
    if (activePlayers.length === 1) {
      // 游戏结束，唯一活跃玩家获胜
      return endRound(room, true);
    }
    
    // 检查是否所有活跃玩家都已行动且下注相等
    if (checkRoundComplete(room)) {
      return endRound(room);
    }
    
    return { 
      success: true, 
      nextPlayer,
      pot: game.pot
    };
  } catch (error) {
    console.error('处理弃牌失败:', error);
    return { success: false, error: error.message };
  }
}

// 处理看牌
function handleCheck(room, playerId) {
  try {
    const game = room.game;
    const playerState = game.playerStates[playerId];
    
    // 检查是否可以看牌
    const highestBet = getHighestBet(room);
    if (playerState.bet < highestBet) {
      return { success: false, error: "不能看牌，必须跟注或弃牌" };
    }
    
    // 移动到下一个玩家
    const nextPlayer = getNextActivePlayer(room);
    game.currentPlayer = room.players.indexOf(nextPlayer);
    
    // 检查是否所有活跃玩家都已行动且下注相等
    if (checkRoundComplete(room)) {
      return endRound(room);
    }
    
    return { 
      success: true, 
      nextPlayer,
      pot: game.pot
    };
  } catch (error) {
    console.error('处理看牌失败:', error);
    return { success: false, error: error.message };
  }
}

// 处理跟注
function handleCall(room, playerId) {
  try {
    const game = room.game;
    const playerState = game.playerStates[playerId];
    
    // 计算需要跟注的金额
    const highestBet = getHighestBet(room);
    const callAmount = highestBet - playerState.bet;
    
    if (callAmount <= 0) {
      return { success: false, error: "不需要跟注，可以看牌" };
    }
    
    // 检查玩家筹码是否足够
    if (callAmount > playerState.chips) {
      // 全押
      const allInAmount = playerState.chips;
      playerState.bet += allInAmount;
      playerState.totalBet += allInAmount;
      playerState.chips = 0;
      playerState.allIn = true;
      game.pot += allInAmount;
    } else {
      // 正常跟注
      playerState.bet += callAmount;
      playerState.totalBet += callAmount;
      playerState.chips -= callAmount;
      game.pot += callAmount;
    }
    
    // 移动到下一个玩家
    const nextPlayer = getNextActivePlayer(room);
    game.currentPlayer = room.players.indexOf(nextPlayer);
    
    // 检查是否所有活跃玩家都已行动且下注相等
    if (checkRoundComplete(room)) {
      return endRound(room);
    }
    
    return { 
      success: true, 
      nextPlayer,
      pot: game.pot
    };
  } catch (error) {
    console.error('处理跟注失败:', error);
    return { success: false, error: error.message };
  }
}

// 处理下注
function handleBet(room, playerId, amount) {
  try {
    const game = room.game;
    const playerState = game.playerStates[playerId];
    
    // 检查是否可以下注
    const highestBet = getHighestBet(room);
    if (highestBet > 0) {
      return { success: false, error: "已有玩家下注，请使用加注" };
    }
    
    // 检查下注金额是否有效
    if (amount < game.minBet) {
      return { success: false, error: `下注金额不能小于最小下注额 ${game.minBet}` };
    }
    
    // 检查玩家筹码是否足够
    if (amount > playerState.chips) {
      return { success: false, error: "筹码不足" };
    }
    
    // 执行下注
    playerState.bet = amount;
    playerState.totalBet += amount;
    playerState.chips -= amount;
    game.pot += amount;
    
    // 更新最小加注额
    game.minBet = amount;
    
    // 移动到下一个玩家
    const nextPlayer = getNextActivePlayer(room);
    game.currentPlayer = room.players.indexOf(nextPlayer);
    
    return { 
      success: true, 
      nextPlayer,
      pot: game.pot
    };
  } catch (error) {
    console.error('处理下注失败:', error);
    return { success: false, error: error.message };
  }
}

// 处理加注
function handleRaise(room, playerId, amount) {
  try {
    const game = room.game;
    const playerState = game.playerStates[playerId];
    
    // 计算总下注额
    const highestBet = getHighestBet(room);
    const totalAmount = highestBet + amount;
    
    // 检查加注金额是否有效
    if (amount < game.minBet) {
      return { success: false, error: `加注金额不能小于最小加注额 ${game.minBet}` };
    }
    
    // 检查玩家筹码是否足够
    const raiseAmount = totalAmount - playerState.bet;
    if (raiseAmount > playerState.chips) {
      return { success: false, error: "筹码不足" };
    }
    
    // 执行加注
    playerState.bet = totalAmount;
    playerState.totalBet += raiseAmount;
    playerState.chips -= raiseAmount;
    game.pot += raiseAmount;
    
    // 更新最小加注额
    game.minBet = amount;
    
    // 移动到下一个玩家
    const nextPlayer = getNextActivePlayer(room);
    game.currentPlayer = room.players.indexOf(nextPlayer);
    
    return { 
      success: true, 
      nextPlayer,
      pot: game.pot
    };
  } catch (error) {
    console.error('处理加注失败:', error);
    return { success: false, error: error.message };
  }
}

// 处理回答问题
function handleAnswerQuestion(room, playerId, cardIndex, answer) {
  try {
    const game = room.game;
    const playerCards = game.playerCards[playerId];
    
    if (!playerCards) {
      return { success: false, error: "玩家卡牌不存在" };
    }
    
    if (cardIndex < 0 || cardIndex >= playerCards.specialCards.length) {
      return { success: false, error: "无效的卡牌索引" };
    }
    
    const card = playerCards.specialCards[cardIndex];
    
    if (card.visible) {
      return { success: false, error: "该卡牌已经可见" };
    }
    
    const question = card.question;
    if (!question) {
      return { success: false, error: "该卡牌没有关联问题" };
    }
    
    // 检查答案是否正确
    const isCorrect = checkAnswer(question, answer);
    
    if (isCorrect) {
      // 答对，卡牌变为可见
      card.visible = true;
      
      // 根据难度给予奖励
      let reward = null;
      switch (card.difficulty) {
        case 'easy':
          // 简单题没有特殊奖励
          break;
        case 'medium':
          // 中等难度题奖励
          reward = {
            type: 'extra_chips',
            amount: 20
          };
          game.playerStates[playerId].chips += 20;
          break;
        case 'hard':
          // 高等难度题奖励
          reward = {
            type: 'peek_community',
            card: game.deck.cards[0] // 偷看下一张公共牌
          };
          break;
        case 'extreme':
          // 地狱难度题奖励
          reward = {
            type: 'peek_opponent',
            cards: {} // 偷看一名对手的一张底牌
          };
          
          // 随机选择一名对手
          const opponents = room.players.filter(id => id !== playerId);
          if (opponents.length > 0) {
            const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
            const opponentCards = game.playerCards[randomOpponent].holeCards;
            if (opponentCards.length > 0) {
              reward.cards[randomOpponent] = opponentCards[0];
            }
          }
          break;
      }
      
      return { 
        success: true, 
        correct: true, 
        card: {
          suit: card.suit,
          rank: card.rank
        },
        reward
      };
    } else {
      // 答错，卡牌燃烧
      playerCards.specialCards.splice(cardIndex, 1);
      
      return { 
        success: true, 
        correct: false,
        message: "回答错误，卡牌已燃烧"
      };
    }
  } catch (error) {
    console.error('处理回答问题失败:', error);
    return { success: false, error: error.message };
  }
}

// 处理选择卡牌
function handleSelectCards(room, playerId, selectedCards) {
  try {
    const game = room.game;
    const playerCards = game.playerCards[playerId];
    
    if (!playerCards) {
      return { success: false, error: "玩家卡牌不存在" };
    }
    
    if (game.round !== 'river') {
      return { success: false, error: "只能在最后一轮选择保留的卡牌" };
    }
    
    if (!Array.isArray(selectedCards) || selectedCards.length !== 2) {
      return { success: false, error: "必须选择2张卡牌" };
    }
    
    // 检查选择的卡牌是否有效
    const allCards = [...playerCards.holeCards, ...playerCards.specialCards];
    const validSelection = selectedCards.every(index => 
      index >= 0 && index < allCards.length && allCards[index].visible
    );
    
    if (!validSelection) {
      return { success: false, error: "选择的卡牌无效或不可见" };
    }
    
    // 保存选择的卡牌
    game.playerCards[playerId].selectedCards = selectedCards.map(index => allCards[index]);
    
    // 检查是否所有玩家都已选择卡牌
    const allSelected = room.players.every(id => 
      game.playerCards[id].selectedCards || game.playerStates[id].folded
    );
    
    if (allSelected) {
      // 进入摊牌阶段
      return determineWinner(room);
    }
    
    return { success: true };
  } catch (error) {
    console.error('处理选择卡牌失败:', error);
    return { success: false, error: error.message };
  }
}

// 确定赢家
function determineWinner(room) {
  try {
    const game = room.game;
    const results = {};
    
    // 获取所有未弃牌的玩家
    const activePlayers = room.players.filter(id => !game.playerStates[id].folded);
    
    if (activePlayers.length === 1) {
      // 只有一名玩家未弃牌，直接获胜
      const winnerId = activePlayers[0];
      results[winnerId] = {
        position: 1,
        hand: [],
        handType: 'default',
        coinsChange: game.pot
      };
      
      // 更新玩家筹码
      game.playerStates[winnerId].chips += game.pot;
      
      // 记录游戏结果
      room.gameResults = results;
      room.status = 'ended';
      
      return { 
        success: true, 
        gameEnded: true,
        results
      };
    }
    
    // 计算每个玩家的最佳牌型
    const playerHands = {};
    
    activePlayers.forEach(playerId => {
      const playerCards = game.playerCards[playerId];
      
      if (!playerCards.selectedCards || playerCards.selectedCards.length !== 2) {
        // 玩家未选择卡牌，使用默认的两张底牌
        playerCards.selectedCards = playerCards.holeCards;
      }
      
      // 计算最佳牌型
      const hand = calculateBestHand([...playerCards.selectedCards, ...game.communityCards]);
      playerHands[playerId] = hand;
    });
    
    // 比较牌型，确定赢家
    const rankings = rankHands(playerHands);
    
    // 分配奖池
    let position = 1;
    let previousRank = -1;
    
    rankings.forEach(({ playerId, rank }) => {
      if (previousRank !== -1 && rank !== previousRank) {
        position++;
      }
      
      const winAmount = position === 1 ? game.pot : 0;
      
      results[playerId] = {
        position,
        hand: playerHands[playerId].cards,
        handType: playerHands[playerId].type,
        coinsChange: winAmount
      };
      
      // 更新玩家筹码
      if (position === 1) {
        game.playerStates[playerId].chips += winAmount;
      }
      
      previousRank = rank;
    });
    
    // 记录游戏结果
    room.gameResults = results;
    room.status = 'ended';
    
    return { 
      success: true, 
      gameEnded: true,
      results
    };
  } catch (error) {
    console.error('确定赢家失败:', error);
    return { success: false, error: error.message };
  }
}

// 计算最佳牌型
function calculateBestHand(cards) {
  // 实现德州扑克牌型计算逻辑
  // 这里是简化版，实际实现需要更复杂的算法
  
  // 按点数排序
  cards.sort((a, b) => b.getValue() - a.getValue());
  
  // 检查同花
  const flushCards = checkFlush(cards);
  
  // 检查顺子
  const straightCards = checkStraight(cards);
  
  // 检查同花顺
  if (flushCards && straightCards) {
    const straightFlushCards = checkStraightFlush(cards);
    if (straightFlushCards) {
      // 检查皇家同花顺
      if (straightFlushCards[0].getValue() === 14) {
        return {
          type: 'royal_flush',
          cards: straightFlushCards,
          rank: 10
        };
      }
      
      return {
        type: 'straight_flush',
        cards: straightFlushCards,
        rank: 9
      };
    }
  }
  
  // 检查四条
  const fourOfAKind = checkFourOfAKind(cards);
  if (fourOfAKind) {
    return {
      type: 'four_of_a_kind',
      cards: fourOfAKind,
      rank: 8
    };
  }
  
  // 检查葫芦
  const fullHouse = checkFullHouse(cards);
  if (fullHouse) {
    return {
      type: 'full_house',
      cards: fullHouse,
      rank: 7
    };
  }
  
  // 同花
  if (flushCards) {
    return {
      type: 'flush',
      cards: flushCards,
      rank: 6
    };
  }
  
  // 顺子
  if (straightCards) {
    return {
      type: 'straight',
      cards: straightCards,
      rank: 5
    };
  }
  
  // 检查三条
  const threeOfAKind = checkThreeOfAKind(cards);
  if (threeOfAKind) {
    return {
      type: 'three_of_a_kind',
      cards: threeOfAKind,
      rank: 4
    };
  }
  
  // 检查两对
  const twoPair = checkTwoPair(cards);
  if (twoPair) {
    return {
      type: 'two_pair',
      cards: twoPair,
      rank: 3
    };
  }
  
  // 检查一对
  const onePair = checkOnePair(cards);
  if (onePair) {
    return {
      type: 'one_pair',
      cards: onePair,
      rank: 2
    };
  }
  
  // 高牌
  return {
    type: 'high_card',
    cards: cards.slice(0, 5),
    rank: 1
  };
}

// 检查同花
function checkFlush(cards) {
  const suitCounts = {};
  
  cards.forEach(card => {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  });
  
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count >= 5) {
      return cards.filter(card => card.suit === suit).slice(0, 5);
    }
  }
  
  return null;
}

// 检查顺子
function checkStraight(cards) {
  // 去重
  const uniqueValues = [];
  const seen = new Set();
  
  cards.forEach(card => {
    const value = card.getValue();
    if (!seen.has(value)) {
      seen.add(value);
      uniqueValues.push(card);
    }
  });
  
  // 特殊情况：A-5 顺子
  if (seen.has(14) && seen.has(2) && seen.has(3) && seen.has(4) && seen.has(5)) {
    const aceCard = cards.find(card => card.getValue() === 14);
    const result = [
      cards.find(card => card.getValue() === 5),
      cards.find(card => card.getValue() === 4),
      cards.find(card => card.getValue() === 3),
      cards.find(card => card.getValue() === 2),
      aceCard
    ];
    return result;
  }
  
  // 常规顺子
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    const value = uniqueValues[i].getValue();
    if (
      seen.has(value - 1) &&
      seen.has(value - 2) &&
      seen.has(value - 3) &&
      seen.has(value - 4)
    ) {
      return [
        uniqueValues[i],
        cards.find(card => card.getValue() === value - 1),
        cards.find(card => card.getValue() === value - 2),
        cards.find(card => card.getValue() === value - 3),
        cards.find(card => card.getValue() === value - 4)
      ];
    }
  }
  
  return null;
}

// 检查同花顺
function checkStraightFlush(cards) {
  // 按花色分组
  const suitGroups = {};
  
  cards.forEach(card => {
    if (!suitGroups[card.suit]) {
      suitGroups[card.suit] = [];
    }
    suitGroups[card.suit].push(card);
  });
  
  // 检查每个花色组是否有顺子
  for (const suitCards of Object.values(suitGroups)) {
    if (suitCards.length >= 5) {
      const straight = checkStraight(suitCards);
      if (straight) {
        return straight;
      }
    }
  }
  
  return null;
}

// 检查四条
function checkFourOfAKind(cards) {
  const rankCounts = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  for (const [rank, count] of Object.entries(rankCounts)) {
    if (count === 4) {
      const fourCards = cards.filter(card => card.rank === rank);
      const kicker = cards.find(card => card.rank !== rank);
      return [...fourCards, kicker];
    }
  }
  
  return null;
}

// 检查葫芦
function checkFullHouse(cards) {
  const rankCounts = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  let threeOfAKindRank = null;
  let pairRank = null;
  
  for (const [rank, count] of Object.entries(rankCounts)) {
    if (count >= 3 && (!threeOfAKindRank || rankCounts[rank] > rankCounts[threeOfAKindRank])) {
      threeOfAKindRank = rank;
    }
  }
  
  if (!threeOfAKindRank) {
    return null;
  }
  
  for (const [rank, count] of Object.entries(rankCounts)) {
    if (rank !== threeOfAKindRank && count >= 2) {
      pairRank = rank;
      break;
    }
  }
  
  if (!pairRank) {
    return null;
  }
  
  const threeCards = cards.filter(card => card.rank === threeOfAKindRank).slice(0, 3);
  const pairCards = cards.filter(card => card.rank === pairRank).slice(0, 2);
  
  return [...threeCards, ...pairCards];
}

// 检查三条
function checkThreeOfAKind(cards) {
  const rankCounts = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  for (const [rank, count] of Object.entries(rankCounts)) {
    if (count === 3) {
      const threeCards = cards.filter(card => card.rank === rank);
      const kickers = cards.filter(card => card.rank !== rank).slice(0, 2);
      return [...threeCards, ...kickers];
    }
  }
  
  return null;
}

// 检查两对
function checkTwoPair(cards) {
  const rankCounts = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  const pairs = [];
  
  for (const [rank, count] of Object.entries(rankCounts)) {
    if (count >= 2) {
      pairs.push(rank);
    }
  }
  
  if (pairs.length >= 2) {
    // 按点数排序
    pairs.sort((a, b) => {
      const rankValues = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
      };
      return rankValues[b] - rankValues[a];
    });
    
    const firstPairCards = cards.filter(card => card.rank === pairs[0]).slice(0, 2);
    const secondPairCards = cards.filter(card => card.rank === pairs[1]).slice(0, 2);
    const kicker = cards.filter(card => card.rank !== pairs[0] && card.rank !== pairs[1])[0];
    
    return [...firstPairCards, ...secondPairCards, kicker];
  }
  
  return null;
}

// 检查一对
function checkOnePair(cards) {
  const rankCounts = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  for (const [rank, count] of Object.entries(rankCounts)) {
    if (count === 2) {
      const pairCards = cards.filter(card => card.rank === rank);
      const kickers = cards.filter(card => card.rank !== rank).slice(0, 3);
      return [...pairCards, ...kickers];
    }
  }
  
  return null;
}

// 对牌型进行排名
function rankHands(playerHands) {
  const rankings = [];
  
  for (const [playerId, hand] of Object.entries(playerHands)) {
    rankings.push({
      playerId,
      hand,
      rank: hand.rank
    });
  }
  
  // 按牌型排序
  rankings.sort((a, b) => {
    if (a.rank !== b.rank) {
      return b.rank - a.rank;
    }
    
    // 同等牌型，比较牌面
    return compareEqualRankHands(a.hand, b.hand);
  });
  
  return rankings;
}

// 比较同等牌型的牌面
function compareEqualRankHands(handA, handB) {
  for (let i = 0; i < handA.cards.length; i++) {
    const valueA = handA.cards[i].getValue();
    const valueB = handB.cards[i].getValue();
    
    if (valueA !== valueB) {
      return valueB - valueA;
    }
  }
  
  return 0;
}

// 检查答案是否正确
function checkAnswer(question, answer) {
  // 简单实现，实际应用中需要更复杂的逻辑
  return question.answer.toLowerCase() === answer.toLowerCase();
}

// 获取所有房间（用于API访问，返回安全版本）
function getAllRooms() {
  console.log(`getAllRooms 被调用，当前有 ${Object.keys(rooms).length} 个房间`);
  return Object.values(rooms).map(room => sanitizeRoomData(room));
}

// 获取房间对象（用于内部访问）
function getRooms() {
  console.log(`getRooms 被调用，当前有 ${Object.keys(rooms).length} 个房间`);
  return rooms;
}

// 获取房间信息
function getRoomInfo(roomId) {
  const room = rooms[roomId];
  
  if (!room) {
    return null;
  }
  
  // 返回房间信息，包括玩家列表
  return {
    id: room.id,
    name: room.name,
    host: room.host,
    players: room.players,
    maxPlayers: room.maxPlayers,
    status: room.status,
    isPrivate: room.isPrivate,
    createdAt: room.createdAt,
    playerCount: room.players.length,
    // 添加玩家详细信息
    playerDetails: room.players.map(playerId => ({
      id: playerId,
      name: players[playerId]?.name || '未知玩家',
      isHost: playerId === room.host
    }))
  };
}

// 处理游戏操作
function handlePokerAction(roomId, playerId, action, data) {
  try {
    const room = rooms[roomId];
    
    if (!room) {
      return { success: false, error: "房间不存在" };
    }
    
    if (room.status !== 'playing') {
      return { success: false, error: "游戏尚未开始或已结束" };
    }
    
    if (!room.players.includes(playerId)) {
      return { success: false, error: "您不在该房间中" };
    }
    
    const game = room.game;
    
    if (!game) {
      return { success: false, error: "游戏状态不存在" };
    }
    
    // 根据操作类型处理
    switch (action) {
      case 'fold':
        return handleFold(room, playerId);
      
      case 'check':
        return handleCheck(room, playerId);
      
      case 'call':
        return handleCall(room, playerId);
      
      case 'bet':
        return handleBet(room, playerId, data.amount);
      
      case 'raise':
        return handleRaise(room, playerId, data.amount);
      
      case 'answer_question':
        return handleAnswerQuestion(room, playerId, data.cardIndex, data.answer);
      
      case 'select_cards':
        return handleSelectCards(room, playerId, data.selectedCards);
      
      default:
        return { success: false, error: `未知的操作: ${action}` };
    }
  } catch (error) {
    console.error('处理游戏操作失败:', error);
    return { success: false, error: error.message };
  }
}

// 在 gameLogic.js 文件中添加 init 函数
function init(options) {
  console.log('初始化游戏逻辑模块，选项:', options);
  
  // 可以在这里进行一些初始化操作
  // 例如：加载问题数据、设置默认选项等
  
  return {
    success: true
  };
}

// 获取单个房间信息
function getRoom(roomId) {
  return rooms[roomId] || null;
}

// 添加 initRooms 函数
function initRooms() {
  console.log('初始化游戏房间...');
  
  // 这里可以添加从数据库加载房间的逻辑
  // 或者创建一些默认房间
  
  // 示例：创建一个默认房间
  const defaultRoom = {
    id: generateRoomId(),
    name: '默认德州扑克房间',
    host: 'system',
    players: [],
    maxPlayers: 6,
    status: 'waiting',
    createdAt: Date.now(),
    isPrivate: false,
    password: null,
    options: {
      buyIn: 100,
      blinds: [5, 10],
      topic: 'general',
      difficulty: 'medium'
    },
    game: null
  };
  
  // 存储默认房间
  rooms[defaultRoom.id] = defaultRoom;
  
  // 添加一个测试房间
  const testRoom = {
    id: uuidv4(),
    name: '测试知识竞赛房间',
    host: 'system',
    players: [],
    maxPlayers: 4,
    status: 'waiting',
    createdAt: new Date().toISOString(),
    isPrivate: false,
    password: null,
    gameType: 'quiz',
    options: {
      topic: 'blockchain',
      difficulty: 'medium'
    },
    playerStatus: {}
  };
  
  // 存储测试房间
  rooms[testRoom.id] = testRoom;
  
  console.log(`初始化完成，创建了 ${Object.keys(rooms).length} 个房间`);
  
  return { success: true, roomCount: Object.keys(rooms).length };
}

// 添加一个函数来列出所有房间，用于调试
function listAllRooms() {
  console.log('当前所有房间:', JSON.stringify(rooms, null, 2));
  return Object.keys(rooms).map(id => ({
    id,
    name: rooms[id].name,
    players: Object.keys(rooms[id].players).length,
    createdAt: rooms[id].createdAt
  }));
}

module.exports = {
  rooms,
  players,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  handlePokerAction,
  getAllRooms,
  getRoomInfo,
  init,
  getRoom,
  initRooms,
  getRooms,
  listAllRooms
};
