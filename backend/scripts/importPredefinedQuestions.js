#!/usr/bin/env node

/**
 * 导入预定义的区块链知识题目
 * 
 * 使用方法:
 * node importPredefinedQuestions.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, '../database.sqlite');
console.log('使用数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库');
});

// 确保问题表存在
db.run(`CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  options TEXT NOT NULL,
  correctAnswer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  source TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  weight INTEGER DEFAULT 0
)`, (err) => {
  if (err) {
    console.error('创建表失败:', err.message);
    process.exit(1);
  }
});

// 预定义的题目
const predefinedQuestions = [
  // DeFi 简单题
  {
    text: "DeFi的主要特点是什么？",
    options: JSON.stringify([
      "无需中介",
      "中心化控制",
      "仅限银行使用",
      "数据不公开"
    ]),
    correctAnswer: "A",
    explanation: "DeFi通过区块链技术实现无需中介的金融服务。",
    source: "《DeFi基础入门》2023",
    topic: "defi",
    difficulty: "easy"
  },
  {
    text: "什么是流动性质押（Liquidity Pool Staking）？",
    options: JSON.stringify([
      "将代币锁定以提供流动性",
      "挖矿比特币的一种方式",
      "银行存款的替代品",
      "智能合约的编程语言"
    ]),
    correctAnswer: "A",
    explanation: "用户将代币存入流动性池以支持交易并获得奖励。",
    source: "Uniswap文档2023",
    topic: "defi",
    difficulty: "easy"
  },
  
  // DeFi 中等题
  {
    text: "在Uniswap V3中，集中流动性（Concentrated Liquidity）的优势是什么？",
    options: JSON.stringify([
      "用户可选择价格范围，提高资本效率",
      "完全消除无常损失",
      "支持跨链交易",
      "降低交易确认时间"
    ]),
    correctAnswer: "A",
    explanation: "集中流动性允许用户自定义价格范围，提升资金利用率。",
    source: "Uniswap V3白皮书",
    topic: "defi",
    difficulty: "medium"
  },
  {
    text: "Aave协议中的"闪电贷"有何限制？",
    options: JSON.stringify([
      "必须在同一区块内偿还",
      "需要质押10%保证金",
      "仅限ETH使用",
      "贷款期限为30天"
    ]),
    correctAnswer: "A",
    explanation: "闪电贷需在同一交易中借还，否则交易失败。",
    source: "Aave技术文档2023",
    topic: "defi",
    difficulty: "medium"
  },
  
  // DeFi 困难题
  {
    text: "分析Compound协议的利率模型：r = a + b*u，其中u为利用率。当u=90%，a=2%，b=0.25时，借款利率是多少？",
    options: JSON.stringify([
      "24.5%",
      "22.5%",
      "20%",
      "25%"
    ]),
    correctAnswer: "A",
    explanation: "r = 2 + 0.25 * 90 = 24.5%。",
    source: "Compound白皮书",
    topic: "defi",
    difficulty: "hard"
  },
  
  // 区块链基础 简单题
  {
    text: "区块链的主要用途是什么？",
    options: JSON.stringify([
      "分布式数据存储",
      "游戏开发",
      "视频编辑",
      "云计算"
    ]),
    correctAnswer: "A",
    explanation: "区块链通过去中心化网络存储数据。",
    source: "《区块链入门》2022",
    topic: "blockchain-basics",
    difficulty: "easy"
  },
  {
    text: "什么是"区块"？",
    options: JSON.stringify([
      "包含交易的数据单元",
      "挖矿设备的名称",
      "加密算法的一种",
      "智能合约模板"
    ]),
    correctAnswer: "A",
    explanation: "区块是区块链中记录交易的基本单位。",
    source: "Bitcoin白皮书",
    topic: "blockchain-basics",
    difficulty: "easy"
  },
  
  // 区块链基础 中等题
  {
    text: "PoW（工作量证明）的核心目标是什么？",
    options: JSON.stringify([
      "防止双重支付",
      "提高交易速度",
      "降低网络延迟",
      "优化存储空间"
    ]),
    correctAnswer: "A",
    explanation: "PoW通过计算难题确保交易不可篡改。",
    source: "《共识机制概览》2023",
    topic: "blockchain-basics",
    difficulty: "medium"
  },
  
  // 智能合约 简单题
  {
    text: "智能合约的主要特点是什么？",
    options: JSON.stringify([
      "自动执行",
      "需要人工干预",
      "只能用于金融交易",
      "必须使用Java语言"
    ]),
    correctAnswer: "A",
    explanation: "智能合约一旦条件满足就会自动执行，无需人工干预。",
    source: "《智能合约入门》2023",
    topic: "smart-contracts",
    difficulty: "easy"
  },
  
  // 共识机制 简单题
  {
    text: "什么是共识机制？",
    options: JSON.stringify([
      "区块链网络达成一致的方法",
      "加密货币交易所",
      "区块链编程语言",
      "数据存储格式"
    ]),
    correctAnswer: "A",
    explanation: "共识机制是区块链网络中各节点就区块内容达成一致的方法。",
    source: "《区块链技术》2022",
    topic: "consensus",
    difficulty: "easy"
  }
];

// 批量插入题目
console.log(`准备导入 ${predefinedQuestions.length} 道预定义题目...`);

// 开始事务
db.run('BEGIN TRANSACTION', (err) => {
  if (err) {
    console.error('开始事务失败:', err.message);
    db.close();
    process.exit(1);
  }
  
  // 准备插入语句
  const stmt = db.prepare(`
    INSERT INTO questions (text, options, correctAnswer, explanation, source, topic, difficulty, weight)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `);
  
  let inserted = 0;
  
  // 逐个插入题目
  predefinedQuestions.forEach((question, index) => {
    stmt.run(
      question.text,
      question.options,
      question.correctAnswer,
      question.explanation,
      question.source,
      question.topic,
      question.difficulty,
      function(err) {
        if (err) {
          console.error(`导入题目 #${index+1} 失败:`, err.message);
        } else {
          inserted++;
          console.log(`已导入题目 #${index+1}: ${question.text.substring(0, 30)}...`);
        }
        
        // 检查是否完成
        if (index === predefinedQuestions.length - 1) {
          // 提交事务
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('提交事务失败:', err.message);
              db.run('ROLLBACK');
            } else {
              console.log(`导入完成! 成功导入 ${inserted}/${predefinedQuestions.length} 道题目`);
            }
            
            // 关闭数据库连接
            db.close();
          });
        }
      }
    );
  });
  
  stmt.finalize();
}); 