#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { DB_PATH } = require('../config');

console.log(`使用数据库路径: ${DB_PATH}`);
const db = new sqlite3.Database(DB_PATH);

// 清除用户表
db.run('DELETE FROM users', function(err) {
  if (err) {
    console.error('清除用户表失败:', err.message);
  } else {
    console.log(`已删除 ${this.changes} 个用户记录`);
  }
  
  // 重置自增 ID
  db.run('DELETE FROM sqlite_sequence WHERE name = "users"', function(err) {
    if (err) {
      console.error('重置用户 ID 失败:', err.message);
    } else {
      console.log('用户 ID 已重置');
    }
    db.close();
  });
}); 