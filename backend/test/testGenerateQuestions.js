#!/usr/bin/env node

/**
 * 测试区块链知识题目生成脚本
 * 
 * 使用方法:
 * node testGenerateQuestions.js --mode generate --count 10 --difficulty 简单 --topic 区块链基础
 * node testGenerateQuestions.js --mode check
 */

const { spawn } = require('child_process');
const path = require('path');
const { program } = require('commander');

program
  .option('--mode <mode>', '测试模式: generate, check', 'check')
  .option('--count <number>', '要生成的题目数量', '10')
  .option('--difficulty <difficulty>', '难度级别', '简单')
  .option('--topic <topic>', '主题', '区块链基础')
  .option('--db <path>', '数据库路径', path.join(__dirname, '../questions.db'))
  .parse(process.argv);

const options = program.opts();
const mode = options.mode;
const count = options.count;
const difficulty = options.difficulty;
const topic = options.topic;
const dbPath = options.db;

console.log('测试模式:', mode);

// 修改这里: 使用正确的脚本路径
const scriptsDir = path.join(__dirname, '../scripts');
const generateScriptPath = path.join(scriptsDir, 'generateQuestions.js');
const checkScriptPath = path.join(scriptsDir, 'checkQuestions.js');

if (mode === 'generate') {
  console.log('注意: 测试模式下，生成的题目会被标记为测试数据');
  
  // 构建命令
  const command = `node ${generateScriptPath} --count ${count} --difficulty ${difficulty} --topic ${topic} --db ${dbPath} --delay 1000`;
  console.log('执行命令:', command);
  
  // 连接到数据库
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('无法连接到数据库:', err.message);
      process.exit(1);
    }
    console.log('已连接到数据库:', dbPath);
  });
  
  // 执行生成脚本
  const generateProcess = spawn('node', [
    generateScriptPath,
    '--count', count,
    '--difficulty', difficulty,
    '--topic', topic,
    '--db', dbPath,
    '--delay', '1000'
  ]);
  
  generateProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  generateProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  generateProcess.on('close', (code) => {
    if (code === 0) {
      console.log('测试成功: 生成脚本执行完成');
      
      // 查询生成的题目
      db.all('SELECT COUNT(*) as count FROM questions', (err, rows) => {
        if (err) {
          console.error('查询失败:', err.message);
        } else {
          console.log(`数据库中共有 ${rows[0].count} 道题目`);
        }
        db.close();
      });
    } else {
      console.error('测试失败: 生成脚本退出，代码:', code);
      db.close();
      process.exit(1);
    }
  });
} else if (mode === 'check') {
  // 执行检查脚本
  const checkProcess = spawn('node', [
    checkScriptPath,
    '--db', dbPath,
    '--count', '20'
  ]);
  
  checkProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  checkProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  checkProcess.on('close', (code) => {
    if (code === 0) {
      console.log('测试成功: 检查脚本执行完成');
    } else {
      console.error('测试失败: 检查脚本退出，代码:', code);
      process.exit(1);
    }
  });
} else {
  console.error('未知的测试模式:', mode);
  process.exit(1);
}