#!/usr/bin/env node

/**
 * 批量生成区块链知识题目脚本
 * 
 * 使用方法:
 * node generateQuestions.js --count 10 --difficulty 简单,中等,困难 --topic 区块链基础,智能合约,共识机制
 */

const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { program } = require('commander');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 配置命令行参数
program
  .option('-c, --count <number>', '要生成的题目数量', '10')
  .option('-d, --difficulty <list>', '难度级别列表(逗号分隔)', '简单,中等,困难,地狱')
  .option('-t, --topic <list>', '主题列表(逗号分隔)', '区块链基础,智能合约,共识机制,加密货币,去中心化应用')
  .option('--db <path>', '数据库路径', path.join(__dirname, '../database.sqlite'))
  .option('--delay <ms>', '每个请求之间的延迟(毫秒)', '2000')
  .parse(process.argv);

const options = program.opts();

// 解析参数
const count = parseInt(options.count, 10);
const difficulties = options.difficulty.split(',');
const topics = options.topic.split(',');
const dbPath = options.db;
const delay = parseInt(options.delay, 10);

// API 配置
const DIFY_API_KEY = process.env.DIFY_API_KEY || 'app-frrUU7gB8BnlhvAGl5AH9Coh';
const DIFY_API_URL = process.env.DIFY_API_URL || 'https://api.dify.ai/v1';

// 连接数据库
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
  territoryId TEXT NOT NULL,
  difficulty TEXT NOT NULL
)`, (err) => {
  if (err) {
    console.error('创建表失败:', err.message);
    process.exit(1);
  }
});

// 添加这行代码来显示实际使用的数据库路径
console.log('使用数据库路径:', dbPath);

// 检查题目是否已存在
async function questionExists(question) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM questions WHERE text = ?', [question], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(!!row);
    });
  });
}

// 保存题目到数据库
async function saveQuestion(questionData, topic, difficulty) {
  return new Promise((resolve, reject) => {
    // 开始事务
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 处理correctAnswer字段，确保格式一致
      let correctAnswer = questionData.correctAnswer;
      // 如果是数组，转换为逗号分隔的字符串
      if (Array.isArray(correctAnswer)) {
        correctAnswer = correctAnswer.join(',');
      }
      
      const stmt = db.prepare(`
        INSERT INTO questions (text, options, correctAnswer, explanation, source, territoryId, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        questionData.question,                // text
        JSON.stringify(questionData.options), // options
        correctAnswer,                        // correctAnswer
        questionData.explanation || '无解释',  // explanation
        questionData.references || 'Dify API', // source - 使用references字段作为source
        topic,                                // territoryId
        difficulty,                           // difficulty
        function(err) {
          if (err) {
            // 回滚事务
            db.run('ROLLBACK', () => {
              reject(err);
            });
            return;
          }
          
          const lastId = this.lastID;
          
          // 提交事务
          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK', () => {
                reject(err);
              });
              return;
            }
            
            resolve(lastId);
          });
        }
      );
      
      stmt.finalize();
    });
  });
}

// 从 Dify 生成题目
async function generateQuestionsFromDify(topic, difficulty, batchSize) {
  try {
    // 更新提示词模板，使其更加结构化和专业
    const prompt = `请生成${batchSize}道关于${topic}的${difficulty}难度的区块链知识问答题，严格遵循以下规则：

【${difficulty}难度要求】
${difficulty === '简单' ? 
  '- 题干≤30字，4个选项\n- 考察基础术语和概念' : 
  difficulty === '中等' ? 
  '- 题干应包含具体协议名称、版本号和年份\n- 题干50-80字，包含近期技术参数或发展\n- 5个选项，每个选项至少20字，包含具体数据或技术细节\n- 2-3个正确答案\n- 选项应包含部分正确但有误导性的内容' : 
  difficulty === '困难' ? 
  '- 题干100-150字，必须包含具体协议名称、版本号、时间点和技术背景\n- 包含技术方案对比、可验证的链上数据或复杂概念\n- 6个选项，每个选项至少50字\n- 每个选项必须包含具体数据、百分比或技术参数\n- 选项必须具有高度迷惑性，包含部分正确但有关键错误的内容\n- 2-4个正确答案\n- 必须包含以下题型：案例分析、技术比较、代码漏洞分析、性能评估、治理决策分析' :
  '- 题干150-200字，必须包含代码片段、数学公式或系统架构图\n- 必须涵盖密码学、协议漏洞、复杂经济模型或前沿技术实现\n- 8个选项，每个选项至少80字\n- 每个选项必须包含具体数据、百分比和技术参数\n- 选项必须具有极高迷惑性，包含多个部分正确但有关键错误的内容\n- 2-4个正确答案\n- 必须要求跨领域知识整合（如密码学+经济学+治理）\n- 必须包含最新研究成果或前沿技术（2023-2025年）'}

【题目类型多样性要求】
在生成题目时，必须包含以下多种类型的题目（每种类型至少生成一道题）：
1. 实际应用题：涉及区块链技术在实际场景中的应用案例、部署挑战或解决方案评估
2. 数据推断题：基于链上数据、性能指标或市场数据进行分析和推断
3. 行业最新消息题：涉及2021-2025年间的重要协议升级、治理决策或技术突破
4. 高阶技术题：涉及底层技术原理、密码学机制、共识算法优化或跨链技术
5. 安全与风险题：涉及安全漏洞分析、攻击向量识别或风险缓解策略
${difficulty === '中等' || difficulty === '困难' || difficulty === '地狱' ? '6. 经济模型题：涉及代币经济学、激励机制设计或流动性分析' : ''}
${difficulty === '困难' || difficulty === '地狱' ? '7. 前沿研究题：涉及最新学术研究成果、创新机制或实验性协议' : ''}
${difficulty === '地狱' ? 
`8. 复合型难题：需要同时考虑技术、经济、治理和安全多个维度
9. 零知识证明电路优化题：涉及ZK证明系统的电路设计和优化
10. 共识算法攻击题：分析BFT类共识算法的安全边界和攻击向量
11. 形式化验证题：分析智能合约形式化验证的边界条件
12. 量子计算威胁题：分析量子计算对区块链密码学的威胁` : ''}

【${topic}领域深度要求】
- 确保问题涵盖${topic}的核心技术概念
- 必须包含2021-2025年间的最新发展、具体数据或参数
- 选项应有足够的技术深度和区分度
${difficulty === '中等' ? 
  '- 至少包含一个需要理解技术原理才能判断的选项\n- 至少包含一个看似合理但实际错误的选项' : 
  difficulty === '困难' ? 
  '- 必须包含专业术语和技术细节\n- 选项之间的差异应该是微妙但关键的\n- 至少包含一个需要综合多个知识点才能判断的选项\n- 至少包含一个引用具体数据或研究结果的选项\n- 至少包含一个概念混淆的选项\n- 至少包含一个条件缺失的选项\n- 至少包含一个无关但看似相关的选项' :
  difficulty === '地狱' ?
  '- 必须包含高级专业术语和前沿技术细节\n- 选项之间的差异必须极其微妙且关键\n- 必须包含需要综合多个领域知识才能判断的选项\n- 必须包含引用最新研究数据或技术规范的选项\n- 必须包含概念混淆但部分正确的选项\n- 必须包含条件缺失但看似完整的选项\n- 必须包含无关但高度相关的选项\n- 必须包含代码级或协议级的技术细节\n- 必须要求数学推导或代码分析才能解答' : ''}

【干扰项设计策略】
- 类型1：过时数据（如使用旧版本参数）
- 类型2：概念位移（如把技术特性归属到错误的协议）
- 类型3：正确但无关（如讨论技术却插入治理内容）
${difficulty === '困难' || difficulty === '地狱' ? '- 类型4：部分正确但关键错误（如数据准确但结论错误）' : ''}
${difficulty === '地狱' ? '- 类型5：多重条件缺失（需要考虑多个前提条件）\n- 类型6：跨领域混淆（如将经济学概念与技术实现混淆）\n- 类型7：看似简单的选项隐含深层技术错误' : ''}

【重要提示】
- 选项内容不要包含括号内的提示说明，这些提示仅供你参考
- 选项应该是完整、专业的陈述，不包含任何元数据或标注
- 确保不同类型的题目均衡分布，不要集中在某一类型
- ${difficulty === '地狱' ? '地狱难度题目必须比困难难度更具挑战性，需要专业人士深入思考' : '题目难度必须符合指定难度级别'}
${difficulty === '地狱' ? '- 地狱难度题目必须包含代码片段、数学公式或需要推导的内容\n- 必须确保题目有明确的正确答案，不能是开放性问题' : ''}

【示例题目】
${difficulty === '中等' ? 
  `"某DeFi协议在Arbitrum链上部署时，发现以下交易特征：
- 平均Gas费比以太坊主网低80%
- 但跨链资产桥接需要18分钟确认
- 用户投诉当ETH价格波动>5%时出现滑点异常

解决方案中应优先考虑哪两项改进？（多选）
A. 改用Optimism的快速存款桥（平均2分钟到账）
B. 集成Chainlink的低延迟预言机（更新频率提升至10秒）
C. 将AMM算法从Uniswap V2升级至V3（滑点降低35%）
D. 迁移至Polygon zkEVM（Gas费再降40%但兼容性风险+25%）
E. 添加TWAP价格保护机制（当波动>3%时暂停交易）"` : 
  difficulty === '困难' ? 
  `"分析以下以太坊2023年数据：
- EIP-1559实施后年销毁ETH：800,000枚
- 合并后年增发ETH：200,000枚
- 当前Staking APR：4.2%

当Lido的市场份额从32%升至45%时，会导致哪些后果？（多选）
A. 质押中心化风险评分从7.1升至8.4
B. 预言机委员会选举延迟增加300毫秒
C. LST二级市场溢价率从1.5%降至0.8%
D. 智能合约漏洞风险概率提升2.3倍
E. 提案通过所需最低票数从17M ETH增至21M ETH"` :
  difficulty === '地狱' ?
  `"在Plonky2的递归证明系统中，给定以下约束条件：
\`\`\`rust
let a = Fp::from_bytes_le(&[0x1a; 32])?; 
let b = a.inverse().unwrap(); 
constrain!(b * a == Fp::ONE); // ① 乘法逆元约束
\`\`\`

当使用Goldilocks域（p=2^64 - 2^32 + 1）时，若将①处的约束替换为：
\`\`\`rust
constrain!(a.pow([p-2]) * a == Fp::ONE); // ② 费马小定理实现
\`\`\`

此修改会如何影响以下指标？（多选）  
A. 证明生成时间增加约37%（因模幂运算开销）  
B. 验证电路规模减少12个约束（省去扩展欧几里得算法）  
C. 递归深度限制从28层降至19层（堆栈内存消耗变化）  
D. 需要额外的预编译合约支持（违反EIP-152标准）"` : ''}

请以JSON数组格式返回，每个问题包含以下字段：
[
  {
    "question": "问题内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"${difficulty !== '简单' ? ', "E. 选项5"' : ''}${difficulty === '困难' ? ', "F. 选项6"' : ''}${difficulty === '地狱' ? ', "F. 选项6", "G. 选项7", "H. 选项8"' : ''}],
    "correctAnswer": ${difficulty === '简单' ? '"单个正确选项，如A"' : '["多个正确选项，如A,C"]'},
    "explanation": "详细解释为什么正确答案是正确的，其他选项为什么不正确",
    "references": "可选的参考资料或数据来源"
  }
]`;
    
    console.log(`正在生成 ${batchSize} 道 ${topic} - ${difficulty} 难度的题目...`);
    const apiUrl = `${DIFY_API_URL}/v1/chat-messages`;
    console.log(`尝试调用 API: ${apiUrl}`);
    
    const response = await axios.post(
      apiUrl,
      {
        inputs: {},
        query: prompt,
        response_mode: "streaming",
        user: "tester"
      },
      {
        headers: {
          'Authorization': `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );
    
    return new Promise((resolve, reject) => {
      let fullData = '';
      
      response.data.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        // 分割数据流中的每个事件
        const events = chunkStr.split('\n').filter(line => line.trim());
        
        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          
          try {
            const eventData = JSON.parse(event.substring(6));
            
            // 收集所有 agent_message 事件的 answer 字段
            if (eventData.event === 'agent_message' && eventData.answer) {
              fullData += eventData.answer;
            }
          } catch (e) {
            console.log('解析事件数据失败:', e.message);
          }
        }
      });
      
      response.data.on('end', () => {
        try {
          // 尝试从完整响应中提取JSON数组
          const jsonArrayMatch = fullData.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonArrayMatch) {
            const jsonArray = JSON.parse(jsonArrayMatch[0]);
            if (Array.isArray(jsonArray) && jsonArray.length > 0) {
              console.log(`成功解析出 ${jsonArray.length} 道题目`);
              resolve(jsonArray);
              return;
            }
          }
          
          // 如果无法提取数组，尝试提取单个JSON对象并包装成数组
          const jsonObjectMatch = fullData.match(/\{\s*"question"[\s\S]*\}/);
          if (jsonObjectMatch) {
            const jsonObject = JSON.parse(jsonObjectMatch[0]);
            if (jsonObject.question && jsonObject.options) {
              console.log('成功解析出1道题目');
              resolve([jsonObject]);
              return;
            }
          }
          
          console.log('无法从响应中提取有效数据');
          console.log('完整响应:', fullData);
          reject(new Error('无法从 API 响应中提取有效数据'));
        } catch (e) {
          console.log('解析响应失败:', e.message);
          reject(e);
        }
      });
      
      response.data.on('error', (err) => {
        console.log('流处理错误:', err.message);
        reject(err);
      });
    });
  } catch (error) {
    console.error('生成题目失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
    throw error;
  }
}

// 随机选择一个元素
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 等待指定时间
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 在脚本末尾添加这个函数
async function checkDatabase() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, text, difficulty, territoryId FROM questions ORDER BY id DESC LIMIT 10', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('数据库中最新的10条记录:');
      rows.forEach(row => {
        console.log(`#${row.id}: [${row.difficulty}][${row.territoryId}] ${row.text.substring(0, 30)}...`);
      });
      resolve(rows.length);
    });
  });
}

// 主函数
async function main() {
  console.log(`开始生成 ${count} 道区块链知识题目...`);
  console.log(`难度级别: ${difficulties.join(', ')}`);
  console.log(`主题: ${topics.join(', ')}`);
  
  let generated = 0;
  let attempts = 0;
  const maxAttempts = count * 2; // 最大尝试次数
  
  // 根据难度设置批量生成数量
  const batchSizes = {
    '简单': 100,
    '中等': 50,
    '困难': 25,
    '地狱': 10
  };
  
  while (generated < count && attempts < maxAttempts) {
    attempts++;
    
    try {
      // 随机选择难度和主题
      const difficulty = randomChoice(difficulties);
      const topic = randomChoice(topics);
      
      // 确定本次批量生成的数量
      const batchSize = Math.min(batchSizes[difficulty], count - generated);
      
      // 批量生成题目
      const questions = await generateQuestionsFromDify(topic, difficulty, batchSize);
      
      // 保存非重复题目
      let savedCount = 0;
      for (const questionData of questions) {
        // 检查题目是否已存在
        const exists = await questionExists(questionData.question);
        if (!exists) {
          const id = await saveQuestion(questionData, topic, difficulty);
          console.log(`成功保存题目 #${id}: ${questionData.question.substring(0, 30)}...`);
          savedCount++;
          generated++;
          
          // 如果已达到目标数量，提前退出
          if (generated >= count) {
            break;
          }
        } else {
          console.log(`跳过重复题目: ${questionData.question.substring(0, 30)}...`);
        }
      }
      
      console.log(`本批次成功保存 ${savedCount}/${questions.length} 道题目`);
      console.log(`总进度: ${generated}/${count}`);
      
      // 添加延迟，避免 API 限制
      if (generated < count) {
        console.log(`等待 ${delay}ms 后继续...`);
        await sleep(delay);
      }
    } catch (error) {
      console.error(`尝试 #${attempts} 失败:`, error.message);
      await sleep(delay); // 出错后也等待一段时间
    }
  }
  
  console.log(`完成! 成功生成 ${generated} 道题目，共尝试 ${attempts} 次`);
  
  await checkDatabase();
  
  db.close();
}

// 运行主函数
main().catch(error => {
  console.error('脚本执行失败:', error);
  db.close();
  process.exit(1);
}); 