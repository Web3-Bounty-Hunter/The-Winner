#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, '../database.sqlite');
console.log(`连接到数据库: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

// 直接尝试添加列，忽略错误
db.run(`ALTER TABLE questions ADD COLUMN weight INTEGER DEFAULT 0`, (err) => {
  if (err) {
    // 如果错误是因为列已存在，这是正常的
    if (err.message.includes('duplicate column name')) {
      console.log('weight 列已存在，无需添加');
    } else {
      console.error('添加 weight 列失败:', err.message);
    }
  } else {
    console.log('成功添加 weight 列到 questions 表');
  }
  
  // 关闭数据库连接
  db.close();
}); 