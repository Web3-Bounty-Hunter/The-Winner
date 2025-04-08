#!/usr/bin/env node

/**
 * 将生成的题目导入到应用程序数据库
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { program } = require('commander');
const { db } = require('../database');
const { generateQuestionsForTopic } = require('./questionGenerator');

program
  .option('--source <path>', '源数据库路径', path.join(__dirname, '../database.sqlite'))
  .option('--target <path>', '目标数据库路径', path.join(__dirname, '../database.sqlite'))
  .option('--table <name>', '源表名', 'generated_questions')
  .option('--count <number>', '导入数量', '0')
  .parse(process.argv);

const options = program.opts();
const sourceDbPath = options.source;
const targetDbPath = options.target;
const sourceTable = options.table;
const importCount = parseInt(options.count, 10);

console.log('源数据库:', sourceDbPath);
console.log('目标数据库:', targetDbPath);

// 连接源数据库
const sourceDb = new sqlite3.Database(sourceDbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('无法连接到源数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到源数据库');
});

// 连接目标数据库
const targetDb = new sqlite3.Database(targetDbPath, (err) => {
  if (err) {
    console.error('无法连接到目标数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到目标数据库');
});

const topics = ['defi', 'blockchain-basics', 'smart-contracts', 'consensus'];
const difficultyConfig = {
  easy: 10,
  medium: 5,
  hard: 1,
  hell: 1
};

async function importQuestions() {
  for (const topic of topics) {
    for (const [difficulty, count] of Object.entries(difficultyConfig)) {
      try {
        const questions = await generateQuestionsForTopic(topic, difficulty, count);
        
        // 批量插入题目
        const stmt = db.prepare(`
          INSERT INTO questions (
            text, options, correctAnswer, explanation, 
            source, difficulty, topic, weight
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        `);

        questions.forEach(q => {
          stmt.run([
            q.text,
            JSON.stringify(q.options),
            q.correctAnswer,
            q.explanation,
            'AI Generated',
            difficulty,
            topic
          ]);
        });

        stmt.finalize();
        console.log(`Imported ${count} ${difficulty} questions for ${topic}`);
      } catch (error) {
        console.error(`Error importing questions for ${topic} ${difficulty}:`, error);
      }
    }
  }
}

// 运行导入
importQuestions().then(() => {
  console.log('Question import completed');
  process.exit(0);
}).catch(error => {
  console.error('Error during import:', error);
  process.exit(1);
});

function closeConnections() {
  sourceDb.close();
  targetDb.close();
} 