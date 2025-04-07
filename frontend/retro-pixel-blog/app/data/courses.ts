import { getQuestions } from "@/app/lib/api-client"

export const courses = [
  {
    id: "defi",
    title: "DeFi Fundamentals",
    description: "Learn the basics of Decentralized Finance",
    icon: "Coins",
  },
  {
    id: "blockchain",
    title: "Blockchain Basics",
    description: "Understanding blockchain technology",
    icon: "Blocks",
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
  },
]

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

