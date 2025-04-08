#!/usr/bin/env node

/**
 * 将生成的题目导入到应用程序数据库
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { program } = require('commander');

program
  .option('--source <path>', '源数据库路径', path.join(__dirname, '../questions.db'))
  .option('--target <path>', '目标数据库路径', path.join(__dirname, '../questions.db'))
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

// 查询未导入的题目
let query = `SELECT * FROM ${sourceTable} WHERE imported = 0`;
const params = [];

if (importCount > 0) {
  query += ' LIMIT ?';
  params.push(importCount);
}

sourceDb.all(query, params, (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message);
    closeConnections();
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log('没有找到未导入的题目');
    closeConnections();
    return;
  }
  
  console.log(`找到 ${rows.length} 道未导入的题目`);
  
  // 开始导入
  targetDb.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('开始事务失败:', err.message);
      closeConnections();
      process.exit(1);
    }
    
    let imported = 0;
    let errors = 0;
    
    // 准备插入语句
    const stmt = targetDb.prepare(`
      INSERT INTO questions (text, options, correctAnswer, explanation, source, territoryId, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // 逐个导入题目
    rows.forEach((row, index) => {
      stmt.run(
        row.question,                // text
        row.options,                 // options
        row.correct_answer,          // correctAnswer
        row.explanation,             // explanation
        'Dify API',                  // source
        row.topic,                   // territoryId
        row.difficulty,              // difficulty
        function(err) {
          if (err) {
            console.error(`导入题目 #${row.id} 失败:`, err.message);
            errors++;
          } else {
            // 标记为已导入
            sourceDb.run(`UPDATE ${sourceTable} SET imported = 1 WHERE id = ?`, [row.id]);
            imported++;
            console.log(`已导入题目 #${row.id}: ${row.question.substring(0, 30)}...`);
          }
          
          // 检查是否完成
          if (index === rows.length - 1) {
            // 提交事务
            targetDb.run('COMMIT', (err) => {
              if (err) {
                console.error('提交事务失败:', err.message);
                targetDb.run('ROLLBACK');
              } else {
                console.log(`导入完成! 成功: ${imported}, 失败: ${errors}`);
              }
              closeConnections();
            });
          }
        }
      );
    });
    
    stmt.finalize();
  });
});

function closeConnections() {
  sourceDb.close();
  targetDb.close();
} 