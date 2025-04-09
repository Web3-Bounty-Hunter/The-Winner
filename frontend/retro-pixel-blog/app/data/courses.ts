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

  // Additional example questions (converted from Chinese to English)
  {
    id: 10,
    courseId: "blockchain",
    title: "What is a Blockchain?",
    question: "What is the most fundamental definition of a blockchain?",
    options: [
      "A. A type of cryptocurrency",
      "B. A distributed ledger technology",
      "C. A programming language",
      "D. A cloud storage service"
    ],
    correctAnswer: "B",
    explanation: "A blockchain is a distributed ledger technology that allows multiple parties to securely record transactions and manage information without a central authority.",
    difficulty: "easy",
    tokenReward: 10
  },
  {
    id: 11,
    courseId: "blockchain",
    title: "The Role of Bitcoin Blocks",
    question: "What is the primary function of blocks in the Bitcoin network?",
    options: [
      "A. Storing user account balances",
      "B. Executing smart contracts",
      "C. Recording and verifying transactions",
      "D. Storing personal user information"
    ],
    correctAnswer: "C",
    explanation: "The primary role of Bitcoin blocks is to record and verify transactions occurring in the network, ensuring immutability and transparency.",
    difficulty: "easy",
    tokenReward: 10
  },
  {
    id: 12,
    courseId: "defi",
    title: "What is Liquidity Mining?",
    question: "In the DeFi ecosystem, what does liquidity mining primarily refer to?",
    options: [
      "A. Generating new tokens by solving mathematical problems",
      "B. Earning protocol tokens as rewards for providing liquidity",
      "C. Gaining trading fees on DEXes",
      "D. Receiving dividends by holding governance tokens"
    ],
    correctAnswer: "B",
    explanation: "Liquidity mining refers to users providing liquidity, often in token pairs, to decentralized protocols in exchange for the protocol's native token rewards.",
    difficulty: "medium",
    tokenReward: 20
  },

  // 区块链基础题目 - blockchain-basics
  // 简单题目 (20道)
  {
    id: 101,
    courseId: "blockchain-basics",
    title: "Blockchain Fundamentals",
    question: "What is the primary purpose of blockchain technology?",
    options: [
      "A. To create cryptocurrencies only",
      "B. To maintain a decentralized and immutable ledger",
      "C. To replace traditional databases",
      "D. To speed up computer processing"
    ],
    correctAnswer: "B",
    explanation: "Blockchain technology primarily serves as a decentralized and immutable ledger system that enables secure and transparent record-keeping without central authority.",
    tokenReward: 10,
    difficulty: "easy",
  },
  {
    id: 102,
    courseId: "blockchain-basics",
    title: "Block Components",
    question: "What are the essential components of a blockchain block?",
    options: [
      "A. Hash, timestamp, and transaction data",
      "B. Username and password",
      "C. CPU and memory information",
      "D. Operating system and applications"
    ],
    correctAnswer: "A",
    explanation: "A blockchain block typically contains the previous block's hash, timestamp, merkle root, and transaction data.",
    tokenReward: 10,
    difficulty: "easy",
  },
  // ... 再添加18个简单题目

  // 中等难度题目 (10道)
  {
    id: 201,
    courseId: "blockchain-basics",
    title: "Consensus Mechanisms Comparison",
    question: "Which consensus mechanism provides the highest transaction throughput?",
    options: [
      "A. Proof of Work (PoW)",
      "B. Proof of Stake (PoS)",
      "C. Delegated Proof of Stake (DPoS)",
      "D. Practical Byzantine Fault Tolerance (PBFT)",
      "E. Verifiable Random Function (VRF)"
    ],
    correctAnswer: "D",
    explanation: "PBFT consensus mechanisms typically provide the highest transaction throughput but sacrifice some degree of decentralization.",
    tokenReward: 20,
    difficulty: "medium",
  },
  // ... 再添加9个中等难度题目

  // 困难题目 (5道)
  {
    id: 301,
    courseId: "blockchain-basics",
    title: "Blockchain Scalability Analysis",
    question: "What is the main bottleneck limiting public blockchain scalability?",
    options: [
      "A. Computational power",
      "B. Storage capacity",
      "C. Network bandwidth and latency",
      "D. Consensus algorithm complexity",
      "E. Smart contract execution",
      "F. State explosion problem"
    ],
    correctAnswer: "F",
    explanation: "The state explosion problem, where state data grows exponentially with chain usage, is one of the primary bottlenecks in public blockchain scalability.",
    tokenReward: 30,
    difficulty: "hard",
  },
  // ... 再添加4个困难题目

  // 地狱难度题目 (5道)
  {
    id: 401,
    courseId: "blockchain-basics",
    title: "Zero-Knowledge Proof Optimization",
    question: "In ZK-SNARK circuit design, which of the following optimization approaches can effectively reduce the computational resources required for proof generation?",
    options: [
      "A. Increasing the number of constraints",
      "B. Using recursive proofs",
      "C. Introducing more auxiliary variables",
      "D. Using a larger finite field",
      "E. Lowering the circuit threshold value",
      "F. Using PLONKish circuit structures",
      "G. Avoiding R1CS constraints",
      "H. Increasing the circuit depth"
    ],
    correctAnswer: "F",
    explanation: "PLONKish circuit structures, through custom gates and lookup tables, can significantly reduce the computational resources required for generating ZK proofs, which is a mainstream direction for ZK circuit optimization.",
    tokenReward: 50,
    difficulty: "hell",
  },
  // ... 再添加4个地狱难度题目
  
  // DeFi主题的题目 - defi
  // 简单题目 (20道)
  {
    id: 501,
    courseId: "defi",
    title: "DeFi Basics",
    question: "What is the main advantage of DeFi over traditional finance?",
    options: [
      "A. Lower transaction fees",
      "B. Permissionless access and transparency",
      "C. Faster transaction processing",
      "D. Government regulation"
    ],
    correctAnswer: "B",
    explanation: "DeFi's main advantage is its permissionless nature and transparency, allowing anyone to access financial services without traditional intermediaries.",
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

