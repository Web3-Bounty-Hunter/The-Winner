#!/usr/bin/env node

/**
 * 查询区块链知识题目脚本
 * 
 * 使用方法:
 * node checkQuestions.js [--db 数据库路径]
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { program } = require('commander');

program
  .option('--db <path>', '数据库路径', path.join(__dirname, '../database.sqlite'))
  .option('--count <number>', '显示的记录数量', '20')
  .option('--topic <topic>', '按主题筛选')
  .option('--difficulty <difficulty>', '按难度筛选')
  .parse(process.argv);

const options = program.opts();
const dbPath = options.db;
const count = parseInt(options.count, 10);

console.log('使用数据库路径:', dbPath);

// 连接数据库
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库');
});

// 构建查询
let query = 'SELECT id, question, correct_answer, difficulty, topic, created_at FROM questions';
const params = [];

if (options.topic || options.difficulty) {
  query += ' WHERE';
  
  if (options.topic) {
    query += ' topic = ?';
    params.push(options.topic);
  }
  
  if (options.topic && options.difficulty) {
    query += ' AND';
  }
  
  if (options.difficulty) {
    query += ' difficulty = ?';
    params.push(options.difficulty);
  }
}

query += ' ORDER BY id DESC LIMIT ?';
params.push(count);

// 执行查询
db.all(query, params, (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log('没有找到任何题目');
  } else {
    console.log(`找到 ${rows.length} 道题目:`);
    rows.forEach(row => {
      console.log(`#${row.id}: [${row.difficulty}][${row.topic}] ${row.question.substring(0, 50)}... (答案: ${row.correct_answer}) - 创建于 ${row.created_at}`);
    });
  }
  
  // 查询总数
  db.get('SELECT COUNT(*) as total FROM questions', (err, row) => {
    if (!err) {
      console.log(`数据库中共有 ${row.total} 道题目`);
    }
    db.close();
  });
}); 