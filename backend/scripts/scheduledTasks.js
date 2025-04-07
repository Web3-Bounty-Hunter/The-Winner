/**
 * 定时任务脚本
 * 用于定期生成新题目和重置题目权重
 */

const { exec } = require('child_process');
const path = require('path');
const { db } = require('../database');

// 定义主题和难度配置
const topics = ['defi', 'blockchain-basics', 'smart-contracts', 'consensus'];
const difficultyConfig = {
  easy: 10,
  medium: 5,
  hard: 1,
  hell: 1
};

// 生成题目函数
async function generateQuestions() {
  console.log('开始生成题目...');
  
  for (const topic of topics) {
    for (const [difficulty, count] of Object.entries(difficultyConfig)) {
      try {
        // 使用子进程调用生成脚本
        const scriptPath = path.join(__dirname, 'generateQuestions.js');
        const command = `node ${scriptPath} -c ${count} -d ${difficulty} -t ${topic}`;
        
        console.log(`执行命令: ${command}`);
        
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`生成题目错误: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`生成题目stderr: ${stderr}`);
            return;
          }
          console.log(`生成题目stdout: ${stdout}`);
        });
        
        // 等待一段时间，避免同时发送太多请求
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`生成题目失败 (${topic}, ${difficulty}):`, error);
      }
    }
  }
}

// 重置题目权重函数
async function resetQuestionWeights() {
  console.log('开始重置题目权重...');
  
  try {
    // 将所有题目的权重重置为0
    await db.run('UPDATE questions SET weight = 0');
    console.log('题目权重重置成功');
  } catch (error) {
    console.error('重置题目权重失败:', error);
  }
}

// 导出函数供服务器使用
module.exports = {
  generateQuestions,
  resetQuestionWeights
};

// 如果直接运行此脚本，则执行生成
if (require.main === module) {
  generateQuestions()
    .then(() => console.log('题目生成完成'))
    .catch(err => console.error('题目生成失败:', err))
    .finally(() => process.exit(0));
} 