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

// API 配置 - 修复URL
const DIFY_API_KEY = process.env.DIFY_API_KEY || 'app-I69tR8xMkdBj0RbLmEt6UJ1y';
const DIFY_API_URL = 'https://api.dify.ai';

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库');
});

// 确保问题表存在，添加 weight 列
db.run(`CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  options TEXT NOT NULL,
  correctAnswer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  source TEXT NOT NULL,
  territoryId TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 0
)`, (err) => {
  if (err) {
    console.error('创建表失败:', err.message);
    process.exit(1);
  }
});

// 显示实际使用的数据库路径
console.log('使用数据库路径:', dbPath);
console.log(`开始生成 ${count} 道区块链知识题目...`);
console.log(`难度级别: ${difficulties.join(', ')}`);
console.log(`主题: ${topics.join(', ')}`);

// 检查题目是否已存在
async function questionExists(question) {
  return new Promise((resolve, reject) => {
    // 改进的列名检测逻辑
    db.all("PRAGMA table_info(questions)", (err, columns) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 检查列名 - 先尝试使用 text，然后是 question，最后是任何包含 text 或 question 的列
      const textColumn = columns.find(col => col.name === 'text') ? 'text' : 
                         columns.find(col => col.name === 'question') ? 'question' : 
                         columns.find(col => col.name.toLowerCase().includes('text') || 
                                           col.name.toLowerCase().includes('question')) ? 
                           columns.find(col => col.name.toLowerCase().includes('text') || 
                                           col.name.toLowerCase().includes('question')).name : null;
      
      if (!textColumn) {
        console.log("警告：无法确定问题文本的列名。尝试创建题目时将进行插入尝试。");
        // 假设问题不存在，允许尝试插入
        resolve(false);
        return;
      }
      
      // 使用识别到的列名查询
      console.log(`使用 ${textColumn} 列检查问题是否存在`);
      db.get(`SELECT id FROM questions WHERE ${textColumn} = ?`, [question], (err, row) => {
        if (err) {
          console.error(`查询失败: ${err.message}`);
          // 错误情况下也尝试继续
          resolve(false);
          return;
        }
        resolve(!!row);
      });
    });
  });
}

// 增强 inspectTableSchema 函数，将列名映射保存为全局变量
let columnMapping = {}; // 存储实际列名与代码中使用的列名的映射

async function inspectTableSchema() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(questions)", (err, columns) => {
      if (err) {
        console.error('获取表结构失败:', err.message);
        reject(err);
        return;
      }
      
      console.log('\n===== 数据库表实际结构 =====');
      columns.forEach(col => {
        console.log(`${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
      });
      console.log('===========================\n');
      
      // 创建一个字段名映射表
      columnMapping = createColumnMapping(columns);
      console.log('列名映射:', columnMapping);
      
      // 检查是否有特殊的NOT NULL列缺乏默认值
      const criticalColumns = columns.filter(col => 
        col.notnull === 1 && !col.dflt_value && col.name !== 'id'
      );
      
      if (criticalColumns.length > 0) {
        console.warn('警告: 以下列是NOT NULL但没有默认值，可能导致插入错误:');
        criticalColumns.forEach(col => console.warn(`- ${col.name}`));
      }
      
      resolve(columns);
    });
  });
}

// 创建字段名映射表函数
function createColumnMapping(columns) {
  const mapping = {};
  
  // 定义可能的命名变体
  const variants = {
    'text': ['text', 'question', 'content'],
    'correctAnswer': ['correctAnswer', 'correct_answer', 'answer'],
    'territoryId': ['territoryId', 'territory_id', 'territory', 'topic', 'category'],
    'options': ['options', 'choices'],
    'explanation': ['explanation', 'explain'],
    'source': ['source', 'reference', 'references'],
    'difficulty': ['difficulty', 'level'],
    'weight': ['weight', 'priority', 'importance']
  };
  
  // 反向映射 - 遍历数据库中的每一列
  columns.forEach(col => {
    // 找到这个列名对应的标准名称
    for (const [standardName, possibleNames] of Object.entries(variants)) {
      if (possibleNames.includes(col.name.toLowerCase())) {
        mapping[standardName] = col.name;
        break;
      }
    }
  });
  
  return mapping;
}

// 更新 saveQuestion 函数
async function saveQuestion(questionData, topic, difficulty) {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', async (err) => {
      if (err) {
        console.error('开始事务失败:', err.message);
        reject(err);
        return;
      }
      
      try {
        const columns = await inspectTableSchema();
        
        // 处理correctAnswer字段，确保格式一致
        let correctAnswer = questionData.correctAnswer;
        if (Array.isArray(correctAnswer)) {
          correctAnswer = correctAnswer.join(',');
        }
        
        // 使用列映射动态构建插入语句
        const validColumns = [];
        const placeholders = [];
        const values = [];
        
        // 用于检查列是否存在
        const columnExists = name => columns.some(col => col.name === name);
        
        // 尝试添加text/question列
        if (columnExists(columnMapping.text)) {
          validColumns.push(columnMapping.text);
          placeholders.push('?');
          values.push(questionData.question);
        }
        
        // 尝试添加content列 (如果存在)
        if (columnExists('content')) {
          validColumns.push('content');
          placeholders.push('?');
          values.push(questionData.question || "");
        }
        
        // 添加options列
        if (columnExists(columnMapping.options)) {
          validColumns.push(columnMapping.options);
          placeholders.push('?');
          values.push(JSON.stringify(questionData.options));
        }
        
        // 添加correctAnswer/correct_answer列
        if (columnExists(columnMapping.correctAnswer)) {
          validColumns.push(columnMapping.correctAnswer);
          placeholders.push('?');
          values.push(correctAnswer);
        }
        
        // 添加explanation列
        if (columnExists(columnMapping.explanation)) {
          validColumns.push(columnMapping.explanation);
          placeholders.push('?');
          values.push(questionData.explanation || '无解释');
        }
        
        // 添加source/reference列
        if (columnExists(columnMapping.source)) {
          validColumns.push(columnMapping.source);
          placeholders.push('?');
          values.push(questionData.references || 'Dify API');
        }
        
        // 添加territory/topic列
        if (columnExists(columnMapping.territoryId)) {
          validColumns.push(columnMapping.territoryId);
          placeholders.push('?');
          values.push(topic);
        }
        
        // 添加difficulty列
        if (columnExists(columnMapping.difficulty)) {
          validColumns.push(columnMapping.difficulty);
          placeholders.push('?');
          values.push(difficulty);
        }
        
        // 添加weight列
        if (columnExists(columnMapping.weight)) {
          validColumns.push(columnMapping.weight);
          placeholders.push('?');
          values.push(0);
        }
        
        // 构建SQL语句
        const insertSql = `INSERT INTO questions (${validColumns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        console.log('执行SQL:', insertSql);
        console.log('使用参数:', values);
        
        // 执行插入
        db.run(insertSql, values, function(err) {
          if (err) {
            console.error('插入数据失败:', err.message);
            db.run('ROLLBACK', () => reject(err));
            return;
          }
          
          const lastId = this.lastID;
          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              console.error('提交事务失败:', commitErr.message);
              db.run('ROLLBACK', () => reject(commitErr));
              return;
            }
            
            console.log(`成功保存题目，ID: ${lastId}`);
            resolve(lastId);
          });
        });
        
      } catch (error) {
        console.error('保存题目过程中出错:', error.message);
        db.run('ROLLBACK', () => reject(error));
      }
    });
  });
}

// 从 Dify 生成题目 - 优化版本
async function generateQuestionsFromDify(topic, difficulty, batchSize) {
  try {
    // 更新提示词模板，使其更加结构化和专业
    const prompt = `请生成${batchSize}道关于${topic}的${difficulty}难度的区块链知识问答题，严格遵循以下规则：

【${difficulty}难度要求】
${difficulty === '简单' ? 
  '- 题干≤30字，4个选项\n- 考察基础术语和概念' : 
  difficulty === '中等' ? 
  '- 题干应包含具体协议名称、版本号和年份\n- 题干50-80字，包含近期技术参数或发展\n- 5个选项，每个选项至少20字，包含具体数据或技术细节\n- 2-3个正确答案\n- 选项应包含部分正确但有误导性的内容' : 
  difficulty === '困难' || difficulty === 'hard' ? 
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
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"${difficulty !== '简单' ? ', "E. 选项5"' : ''}${difficulty === '困难' || difficulty === 'hard' ? ', "F. 选项6"' : ''}${difficulty === '地狱' ? ', "F. 选项6", "G. 选项7", "H. 选项8"' : ''}],
    "correctAnswer": ${difficulty === '简单' ? '"单个正确选项，如A"' : '["多个正确选项，如A,C"]'},
    "explanation": "详细解释为什么正确答案是正确的，其他选项为什么不正确",
    "references": "可选的参考资料或数据来源"
  }
]`;
    
    console.log(`正在生成 ${batchSize} 道 ${topic} - ${difficulty} 难度的题目...`);
    
    // 使用正确的API URL
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
      let lastProgressLog = 0;
      let processingTimeout = null;
      
      // 接收数据块
      response.data.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        
        // 记录流式进度
        const now = Date.now();
        if (now - lastProgressLog > 5000) { // 每5秒输出一次进度
          lastProgressLog = now;
          console.log(`正在接收API响应...当前已收集 ${fullData.length} 字节`);
        }
        
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
            // 忽略解析错误，继续收集数据
          }
        }
        
        // 清除之前的处理超时
        if (processingTimeout) {
          clearTimeout(processingTimeout);
        }
        
        // 设置新的处理超时 - 如果1秒内没有新数据，尝试处理
        processingTimeout = setTimeout(() => {
          try {
            // 尝试提前处理数据
            const possibleQuestions = extractQuestions(fullData, topic, difficulty);
            if (possibleQuestions.length > 0) {
              console.log(`提前检测到 ${possibleQuestions.length} 道有效题目，结束接收`);
              resolve(possibleQuestions);
            }
          } catch (e) {
            // 忽略提前处理错误
          }
        }, 1000);
      });
      
      // 处理流结束
      response.data.on('end', () => {
        if (processingTimeout) {
          clearTimeout(processingTimeout);
        }
        
        console.log(`API响应接收完成，共收集 ${fullData.length} 字节`);
        processFullData();
      });
      
      // 处理错误
      response.data.on('error', (err) => {
        if (processingTimeout) {
          clearTimeout(processingTimeout);
        }
        
        console.error('流处理错误:', err.message);
        
        // 尝试用已收集的数据生成题目
        const fallbackQuestions = extractQuestions(fullData, topic, difficulty);
        if (fallbackQuestions.length > 0) {
          console.log(`尽管出错，但提取出 ${fallbackQuestions.length} 道题目`);
          resolve(fallbackQuestions);
          return;
        }
        
        // 没有可用数据，返回模拟题目
        resolve([createMockQuestion(topic)]);
      });
      
      // 处理完整数据的函数
      function processFullData() {
        // 尝试各种方法提取题目
        const questions = extractQuestions(fullData, topic, difficulty);
        
        if (questions.length > 0) {
          console.log(`成功解析出 ${questions.length} 道题目`);
          resolve(questions);
          return;
        }
        
        console.log('无法从响应中提取有效数据，返回模拟题目');
        resolve([createMockQuestion(topic)]);
      }
      
      // 提取题目的函数
      function extractQuestions(text, topic, difficulty) {
        const questions = [];
        
        // 尝试提取JSON数组
        try {
          const jsonArrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonArrayMatch) {
            const parsedArray = JSON.parse(jsonArrayMatch[0]);
            if (Array.isArray(parsedArray) && parsedArray.length > 0 && 
                parsedArray[0].question && parsedArray[0].options) {
              return parsedArray;
            }
          }
        } catch (e) {}
        
        // 尝试提取单个JSON对象
        try {
          const jsonObjectMatch = text.match(/\{\s*"question"[\s\S]*\}/);
          if (jsonObjectMatch) {
            const parsedObj = JSON.parse(jsonObjectMatch[0]);
            if (parsedObj.question && parsedObj.options) {
              return [parsedObj];
            }
          }
        } catch (e) {}
        
        // 尝试提取问题标题和选项
        const questionBlocks = text.split(/(?=问题:|题目:|[\d]+\.)/).filter(block => 
          block.includes('A.') && block.includes('B.') && block.includes('C.')
        );
        
        for (const block of questionBlocks) {
          try {
            const questionMatch = block.match(/(?:问题:|题目:)?([\s\S]*?)(?=A\.)/i);
            const question = questionMatch ? questionMatch[1].trim() : `关于${topic}的问题`;
            
            const options = [];
            const optionMatches = block.match(/([A-H]\.[\s\S]*?)(?=[A-H]\.|正确答案:|$)/gi);
            if (optionMatches) {
              optionMatches.forEach(option => options.push(option.trim()));
            }
            
            // 尝试提取正确答案和解释
            let correctAnswer = "A";
            let explanation = "未提供详细解释";
            
            const correctAnswerMatch = block.match(/正确答案:?\s*([A-H](?:,\s*[A-H])*)/i);
            if (correctAnswerMatch) {
              correctAnswer = correctAnswerMatch[1].split(/,\s*/).map(a => a.trim());
              if (correctAnswer.length === 1) {
                correctAnswer = correctAnswer[0];
              }
            }
            
            const explanationMatch = block.match(/解释:?\s*([\s\S]*?)(?=参考|$)/i);
            if (explanationMatch) {
              explanation = explanationMatch[1].trim();
            }
            
            // 只有当至少有3个选项时才添加问题
            if (options.length >= 3) {
              questions.push({
                question: question,
                options: options,
                correctAnswer: correctAnswer,
                explanation: explanation,
                references: "内容提取自API响应"
              });
            }
          } catch (e) { /* 忽略单个问题提取错误 */ }
        }
        
        return questions;
      }
      
      // 创建模拟题目的函数
      function createMockQuestion(topic) {
        return {
          question: `关于${topic}的示例问题（API响应解析失败）`,
          options: ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
          correctAnswer: "A",
          explanation: "这是一个模拟答案，因为API响应解析失败",
          references: "模拟数据"
        };
      }
    });
  } catch (error) {
    console.error('生成题目失败:', error.message);
    // 返回模拟题目
    return [{
      question: `关于${topic}的示例问题（API调用失败）`,
      options: ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      correctAnswer: "A",
      explanation: "这是一个模拟答案，因为API调用失败",
      references: "模拟数据"
    }];
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

// 打印题目内容到控制台
function printQuestion(question, index, topic, difficulty) {
  console.log('\n========================================');
  console.log(`题目 #${index+1} [${difficulty}][${topic}]`);
  console.log('========================================');
  console.log(`问题: ${question.question}`);
  console.log('选项:');
  question.options.forEach(option => {
    console.log(`  ${option}`);
  });
  console.log(`正确答案: ${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}`);
  console.log('解释:');
  console.log(`  ${question.explanation}`);
  if (question.references) {
    console.log('参考资料:');
    console.log(`  ${question.references}`);
  }
  console.log('========================================\n');
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

// 主函数开始前完善的 checkAndFixDatabase 函数
async function checkAndFixDatabase() {
  return new Promise((resolve, reject) => {
    console.log('检查数据库结构...');
    
    // 检查表是否存在
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'", (err, row) => {
      if (err) {
        console.error('检查表失败:', err.message);
        reject(err);
        return;
      }
      
      // 定义必需的列结构
      const requiredColumns = [
        { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
        { name: 'text', type: 'TEXT NOT NULL' },
        { name: 'options', type: 'TEXT NOT NULL' },
        { name: 'correctAnswer', type: 'TEXT NOT NULL' },
        { name: 'explanation', type: 'TEXT NOT NULL' },
        { name: 'source', type: 'TEXT NOT NULL' },
        { name: 'territoryId', type: 'TEXT NOT NULL' },
        { name: 'difficulty', type: 'TEXT NOT NULL' },
        { name: 'weight', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'content', type: 'TEXT NOT NULL DEFAULT ""' }
      ];
      
      if (!row) {
        console.log('questions表不存在，创建新表...');
        
        // 构建完整的表创建SQL
        const createTableSQL = `CREATE TABLE questions (
          ${requiredColumns.map(col => `${col.name} ${col.type}`).join(',\n          ')}
        )`;
        
        db.run(createTableSQL, (err) => {
          if (err) {
            console.error('创建表失败:', err.message);
            reject(err);
            return;
          }
          console.log('questions表创建成功');
          resolve();
        });
        return;
      }
      
      // 表存在，检查列
      db.all("PRAGMA table_info(questions)", (err, columns) => {
        if (err) {
          console.error('获取表结构失败:', err.message);
          reject(err);
          return;
        }
        
        console.log('当前表结构:', columns.map(c => c.name).join(', '));
        
        // 检查所有必需的列
        const fixes = [];
        let fixCount = 0;
        
        // 创建一个验证和修复每个必需列的函数
        const checkAndAddColumn = (colName, colType) => {
          if (!columns.some(col => col.name === colName)) {
            console.log(`缺少 ${colName} 列，尝试添加...`);
            return new Promise((resolve, reject) => {
              db.run(`ALTER TABLE questions ADD COLUMN ${colName} ${colType}`, (err) => {
                if (err) {
                  console.error(`添加 ${colName} 列失败:`, err.message);
                  reject(err);
                  return;
                }
                console.log(`添加 ${colName} 列成功`);
                fixCount++;
                resolve();
              });
            });
          }
          return Promise.resolve(); // 如果列已存在，返回已解决的Promise
        };
        
        // 检查表结构的特殊情况
        const hasTextColumn = columns.some(col => col.name === 'text');
        const hasQuestionColumn = columns.some(col => col.name === 'question');
        
        // 如果既没有text也没有question列，添加text列
        if (!hasTextColumn && !hasQuestionColumn) {
          fixes.push(checkAndAddColumn('text', 'TEXT'));
        }
        
        // 检查其他所有必需列
        for (const requiredCol of requiredColumns) {
          // 跳过id列(不能添加)和text列(已特殊处理)
          if (requiredCol.name === 'id' || requiredCol.name === 'text') continue;
          
          fixes.push(checkAndAddColumn(requiredCol.name, requiredCol.type.replace(/NOT NULL/, '')));
        }
        
        // 执行所有修复
        if (fixes.length > 0) {
          Promise.all(fixes)
            .then(() => {
              console.log(`完成了 ${fixCount} 项数据库修复`);
              resolve();
            })
            .catch(err => {
              console.error('数据库修复失败:', err.message);
              
              // 如果修复失败，尝试创建新表并迁移数据
              console.log('修复失败，尝试重建表...');
              db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                
                // 创建临时表
                db.run(`CREATE TABLE questions_new (
                  ${requiredColumns.map(col => `${col.name} ${col.type}`).join(',\n                  ')}
                )`, (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }
                  
                  // 尝试迁移数据 (仅迁移存在的列)
                  const existingColumns = columns.map(c => c.name).filter(c => 
                    requiredColumns.some(rc => rc.name === c && c !== 'id')
                  );
                  
                  if (existingColumns.length > 0) {
                    db.run(`INSERT INTO questions_new (${existingColumns.join(', ')})
                      SELECT ${existingColumns.join(', ')} FROM questions`, (err) => {
                      if (err) {
                        console.error('迁移数据失败:', err.message);
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                      }
                      
                      // 替换原表
                      db.run('DROP TABLE questions', (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          reject(err);
                          return;
                        }
                        
                        db.run('ALTER TABLE questions_new RENAME TO questions', (err) => {
                          if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                          }
                          
                          db.run('COMMIT', () => {
                            console.log('成功重建questions表并迁移数据');
                            resolve();
                          });
                        });
                      });
                    });
                  } else {
                    // 没有可迁移的数据，直接替换
                    db.run('DROP TABLE questions', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                      }
                      
                      db.run('ALTER TABLE questions_new RENAME TO questions', (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          reject(err);
                          return;
                        }
                        
                        db.run('COMMIT', () => {
                          console.log('成功创建新的questions表');
                          resolve();
                        });
                      });
                    });
                  }
                });
              });
            });
        } else {
          // 表结构正常
          console.log('数据库结构检查完成，正常');
          resolve();
        }
      });
    });
  });
}

// 主函数
async function main() {
  try {
    // 首先检查和修复数据库
    await checkAndFixDatabase();
    
    // 检查实际表结构
    const tableColumns = await inspectTableSchema();
    
    // 根据实际表结构动态调整保存逻辑
    const columnsToHandle = tableColumns.map(col => col.name);
    console.log('将处理以下列:', columnsToHandle.join(', '));
    
    // 然后继续原有的代码
    console.log(`开始生成 ${count} 道区块链知识题目...`);
    console.log(`难度级别: ${difficulties.join(', ')}`);
    console.log(`主题: ${topics.join(', ')}`);
    
    let generated = 0;
    let attempts = 0;
    const maxAttempts = count * 2; // 最大尝试次数
    
    // 根据难度设置批量生成数量
    const batchSizes = {
      '简单': 3,
      '中等': 2,
      '困难': 1,
      '地狱': 1
    };
    
    while (generated < count && attempts < maxAttempts) {
      attempts++;
      
      try {
        // 随机选择难度和主题
        const difficulty = randomChoice(difficulties);
        const topic = randomChoice(topics);
        
        // 确定本次批量生成的数量
        const batchSize = Math.min(batchSizes[difficulty] || 1, count - generated);
        
        // 批量生成题目
        const questions = await generateQuestionsFromDify(topic, difficulty, batchSize);
        
        // 保存非重复题目并显示
        let savedCount = 0;
        for (const questionData of questions) {
          // 显示题目
          printQuestion(questionData, savedCount, topic, difficulty);
          
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
    
    console.log(`\n=============== 生成完毕 ===============`);
    console.log(`成功生成 ${generated} 道题目，共尝试 ${attempts} 次`);
    
    // 检查数据库中的最新记录
    await checkDatabase();
    
    db.close();
  } catch (error) {
    console.error('脚本执行失败:', error);
    db.close();
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('脚本执行失败:', error);
  db.close();
  process.exit(1);
}); 