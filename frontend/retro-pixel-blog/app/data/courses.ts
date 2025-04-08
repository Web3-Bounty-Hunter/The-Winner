import { getQuestions } from "@/app/lib/api-client"

export const courses = [
  {
    id: "defi",
    title: "DeFi Fundamentals",
    description: "Learn the basics of Decentralized Finance",
    icon: "Coins",
    difficulty: "medium",
  },
  {
    id: "blockchain",
    title: "Blockchain Basics",
    description: "Understanding blockchain technology",
    icon: "Blocks",
    difficulty: "easy",
  },
  {
    id: "crypto",
    title: "Cryptocurrency 101",
    description: "Introduction to cryptocurrencies",
    icon: "Bitcoin",
  },
  {
    id: "nft",
    title: "NFT Masterclass",
    description: "Everything about Non-Fungible Tokens",
    icon: "Image",
  },
]

export const questions = [
  // DeFi questions
  {
    id: 1,
    courseId: "defi",
    title: "What is DeFi?",
    question: "What does DeFi stand for?",
    options: ["Decentralized Finance", "Digital Finance", "Distributed Finance", "Direct Finance"],
    correctAnswer: 0,
    explanation:
      "DeFi stands for Decentralized Finance. It refers to financial applications built on blockchain technologies, typically using smart contracts.",
    tokenReward: 5,
    difficulty: "medium",
  },
  {
    id: 2,
    courseId: "defi",
    title: "Yield Farming",
    question: "What is yield farming in DeFi?",
    options: [
      "Growing crops on a digital farm",
      "Earning interest by lending crypto assets",
      "Mining new cryptocurrencies",
      "Creating new blockchain protocols",
    ],
    correctAnswer: 1,
    explanation:
      "Yield farming involves lending or staking crypto assets in order to generate returns or rewards in the form of additional cryptocurrency.",
    tokenReward: 10,
    difficulty: "medium",
  },
  {
    id: 3,
    courseId: "defi",
    title: "Liquidity Pools",
    question: "What is the main purpose of a liquidity pool in DeFi?",
    options: [
      "To store water for blockchain cooling",
      "To provide funds for crypto exchanges",
      "To enable decentralized trading by locking tokens in smart contracts",
      "To prevent price volatility",
    ],
    correctAnswer: 2,
    explanation:
      "Liquidity pools are smart contracts that lock tokens to enable decentralized trading, lending, and other DeFi functions.",
    tokenReward: 15,
    difficulty: "medium",
  },

  // Blockchain questions
  {
    id: 4,
    courseId: "blockchain",
    title: "Blockchain Fundamentals",
    question: "What is a blockchain?",
    options: [
      "A type of cryptocurrency",
      "A distributed ledger technology",
      "A programming language",
      "A type of computer hardware",
    ],
    correctAnswer: 1,
    explanation:
      "A blockchain is a distributed ledger technology that maintains a growing list of records (blocks) that are linked using cryptography.",
    tokenReward: 5,
    difficulty: "easy",
  },
  {
    id: 5,
    courseId: "blockchain",
    title: "Consensus Mechanisms",
    question: "What is Proof of Stake (PoS)?",
    options: [
      "A method to prove ownership of crypto assets",
      "A consensus mechanism where validators are selected based on the amount of cryptocurrency they hold",
      "A way to stake claims on new blockchain projects",
      "A method to prove the authenticity of transactions",
    ],
    correctAnswer: 1,
    explanation:
      "Proof of Stake (PoS) is a consensus mechanism where validators are chosen to create new blocks based on the number of coins they hold and are willing to 'stake' as collateral.",
    tokenReward: 10,
    difficulty: "medium",
  },

  // Crypto questions
  {
    id: 6,
    courseId: "crypto",
    title: "Bitcoin Basics",
    question: "Who created Bitcoin?",
    options: ["Vitalik Buterin", "Satoshi Nakamoto", "Charlie Lee", "Elon Musk"],
    correctAnswer: 1,
    explanation: "Bitcoin was created by an unknown person or group of people using the pseudonym Satoshi Nakamoto.",
    tokenReward: 5,
    difficulty: "easy",
  },
  {
    id: 7,
    courseId: "crypto",
    title: "Crypto Wallets",
    question: "What is a private key in cryptocurrency?",
    options: [
      "A password to your exchange account",
      "A secret code that allows you to spend your cryptocurrency",
      "The public address where you receive crypto",
      "A key provided by the government",
    ],
    correctAnswer: 1,
    explanation:
      "A private key is a secret, alphanumeric password that allows you to access and manage your cryptocurrency. It should never be shared with anyone.",
    tokenReward: 10,
    difficulty: "medium",
  },

  // NFT questions
  {
    id: 8,
    courseId: "nft",
    title: "NFT Fundamentals",
    question: "What does NFT stand for?",
    options: ["New Financial Token", "Non-Fungible Token", "Network File Transfer", "National Finance Trust"],
    correctAnswer: 1,
    explanation:
      "NFT stands for Non-Fungible Token. Unlike cryptocurrencies, NFTs are unique and cannot be exchanged on a one-to-one basis.",
    tokenReward: 5,
    difficulty: "easy",
  },
  {
    id: 9,
    courseId: "nft",
    title: "NFT Use Cases",
    question: "Which of the following is NOT a common use case for NFTs?",
    options: ["Digital art", "Virtual real estate", "Mining cryptocurrency", "In-game items"],
    correctAnswer: 2,
    explanation:
      "Mining cryptocurrency is not a use case for NFTs. NFTs are commonly used for digital art, virtual real estate, in-game items, collectibles, and more.",
    tokenReward: 10,
    difficulty: "medium",
  },

  // Additional example questions
  {
    id: 10,
    courseId: "blockchain",
    title: "什么是区块链？",
    question: "区块链最基本的定义是什么？",
    options: [
      "A. 一种加密货币",
      "B. 一种分布式账本技术",
      "C. 一种编程语言",
      "D. 一种云存储服务"
    ],
    correctAnswer: "B",
    explanation: "区块链是一种分布式账本技术，允许多方安全地记录交易和管理信息，无需中央权威机构。",
    difficulty: "easy",
    tokenReward: 10
  },
  {
    id: 11,
    courseId: "blockchain",
    title: "比特币区块的作用",
    question: "在比特币网络中，区块的主要作用是什么？",
    options: [
      "A. 存储用户账户余额",
      "B. 执行智能合约",
      "C. 记录和验证交易",
      "D. 存储用户个人信息"
    ],
    correctAnswer: "C",
    explanation: "比特币区块的主要作用是记录和验证网络中发生的交易，确保交易的不可篡改性和透明性。",
    difficulty: "easy",
    tokenReward: 10
  },
  {
    id: 12,
    courseId: "defi",
    title: "什么是流动性挖矿？",
    question: "在DeFi生态系统中，流动性挖矿(Liquidity Mining)主要是指什么？",
    options: [
      "A. 通过解决数学问题来挖掘新代币",
      "B. 通过提供流动性获得协议代币奖励",
      "C. 在DEX上交易代币获取手续费",
      "D. 通过持有治理代币获得分红"
    ],
    correctAnswer: "B",
    explanation: "流动性挖矿是指用户通过向去中心化协议提供流动性（通常是代币对），从而获得协议原生代币作为奖励的过程。",
    difficulty: "medium",
    tokenReward: 20
  },

  // 区块链基础题目 - blockchain-basics
  // 简单题目 (20道)
  {
    id: 101,
    courseId: "blockchain-basics",
    title: "区块链基本概念",
    question: "区块链最基本的定义是什么？",
    options: [
      "A. 一种加密货币",
      "B. 一种分布式账本技术",
      "C. 一种编程语言",
      "D. 一种云存储服务"
    ],
    correctAnswer: "B",
    explanation: "区块链是一种分布式账本技术，允许多方安全地记录交易和管理信息，无需中央权威机构。",
    tokenReward: 10,
    difficulty: "easy",
  },
  {
    id: 102,
    courseId: "blockchain-basics",
    title: "区块构成",
    question: "区块链中的区块通常包含哪些基本组成部分？",
    options: [
      "A. 哈希值、时间戳和交易数据",
      "B. 用户名和密码",
      "C. CPU和内存信息",
      "D. 操作系统和应用程序"
    ],
    correctAnswer: "A",
    explanation: "区块通常包含前一个区块的哈希值、时间戳、merkle根和交易数据等信息。",
    tokenReward: 10,
    difficulty: "easy",
  },
  // ... 再添加18个简单题目

  // 中等难度题目 (10道)
  {
    id: 201,
    courseId: "blockchain-basics",
    title: "共识机制比较",
    question: "以下哪种共识机制能够提供最高的交易吞吐量？",
    options: [
      "A. 工作量证明(PoW)",
      "B. 权益证明(PoS)",
      "C. 授权权益证明(DPoS)",
      "D. 实用拜占庭容错(PBFT)",
      "E. 可验证随机函数(VRF)"
    ],
    correctAnswer: "D",
    explanation: "PBFT系列共识机制通常能提供最高的交易吞吐量，但需要牺牲一定的去中心化程度。",
    tokenReward: 20,
    difficulty: "medium",
  },
  // ... 再添加9个中等难度题目

  // 困难题目 (5道)
  {
    id: 301,
    courseId: "blockchain-basics",
    title: "区块链性能瓶颈分析",
    question: "以下哪个因素是限制公共区块链扩展性的主要瓶颈？",
    options: [
      "A. 计算能力不足",
      "B. 存储容量限制",
      "C. 网络带宽和延迟",
      "D. 共识算法的时间复杂度",
      "E. 智能合约执行效率",
      "F. 状态爆炸问题"
    ],
    correctAnswer: "F",
    explanation: "状态爆炸问题是指随着链上数据和状态的增长，节点需要维护的状态数据量呈指数级增长，这是限制公共区块链扩展性的主要瓶颈之一。",
    tokenReward: 30,
    difficulty: "hard",
  },
  // ... 再添加4个困难题目

  // 地狱难度题目 (5道)
  {
    id: 401,
    courseId: "blockchain-basics",
    title: "零知识证明优化",
    question: "在ZK-SNARK电路设计中，以下哪种优化方法能有效减少证明生成所需的计算资源？",
    options: [
      "A. 增加约束数量",
      "B. 使用递归证明",
      "C. 引入更多辅助变量",
      "D. 采用更大的有限域",
      "E. 降低电路门限值",
      "F. 使用PLONKish电路结构",
      "G. 避免R1CS约束",
      "H. 增加电路深度"
    ],
    correctAnswer: "F",
    explanation: "PLONKish电路结构通过自定义门和查找表等技术，可以显著减少ZK证明生成所需的计算资源，这是目前ZK电路优化的主流方向。",
    tokenReward: 50,
    difficulty: "hell",
  },
  // ... 再添加4个地狱难度题目
  
  // DeFi主题的题目 - defi
  // 简单题目 (20道)
  {
    id: 501,
    courseId: "defi",
    title: "DeFi基础概念",
    question: "DeFi是什么的缩写？",
    options: [
      "A. 分布式金融(Distributed Finance)",
      "B. 去中心化金融(Decentralized Finance)",
      "C. 数字金融(Digital Finance)",
      "D. 衍生品金融(Derivative Finance)"
    ],
    correctAnswer: "B",
    explanation: "DeFi是去中心化金融(Decentralized Finance)的缩写，指基于区块链技术的金融应用生态系统。",
    tokenReward: 10,
    difficulty: "easy",
  },
  // ... 再添加19个简单题目
  
  // 智能合约主题 - smart-contracts
  // 简单题目 (20道)、中等题目(10道)、困难题目(5道)、地狱难度题目(5道)
  
  // 共识机制主题 - consensus
  // 简单题目 (20道)、中等题目(10道)、困难题目(5道)、地狱难度题目(5道)
]

// 辅助函数：按主题和难度获取问题
export function getQuestionsByTopicAndDifficulty(topic: string, difficulty: string, count: number = 10) {
  return questions
    .filter(q => q.courseId === topic && q.difficulty === difficulty)
    .slice(0, count);
}

// 辅助函数：获取课程的所有问题（按难度数量分配）
export function getCourseQuestions(courseId: string) {
  const easyQuestions = getQuestionsByTopicAndDifficulty(courseId, "easy", 20);
  const mediumQuestions = getQuestionsByTopicAndDifficulty(courseId, "medium", 10);
  const hardQuestions = getQuestionsByTopicAndDifficulty(courseId, "hard", 5);
  const hellQuestions = getQuestionsByTopicAndDifficulty(courseId, "hell", 5);
  
  return [...easyQuestions, ...mediumQuestions, ...hardQuestions, ...hellQuestions];
}

// 修改fetchQuestionsFromBackend函数，优先使用本地数据而不是尝试API调用

// 修改 fetchQuestionsFromBackend 函数，使用 api-client.ts 中的 getQuestions 函数

export async function fetchQuestionsFromBackend(courseId: string) {
  console.log(`Getting questions for course: ${courseId}`)

  try {
    // 调用 api-client.ts 中的 getQuestions 函数
    // 将 courseId 映射到适当的主题和难度
    const topic = courseId // 假设 courseId 可以直接用作主题
    const difficulty = "all" // 可以根据需要调整

    console.log(`Calling getQuestions with topic=${topic}, difficulty=${difficulty}`)
    const questions = await getQuestions(topic, difficulty, 10)

    console.log(`Received ${questions.length} questions from API`)
    return questions
  } catch (error) {
    console.error(`Error in fetchQuestionsFromBackend:`, error)

    // 重新抛出错误，让调用者处理
    throw error
  }
}

