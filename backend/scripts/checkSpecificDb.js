#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提示用户输入数据库路径
rl.question('请输入要检查的数据库文件的完整路径: ', (dbPath) => {
  if (!fs.existsSync(dbPath)) {
    console.error(`错误: 文件不存在: ${dbPath}`);
    rl.close();
    return;
  }
  
  console.log(`检查数据库: ${dbPath}`);
  
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('连接数据库失败:', err.message);
      rl.close();
      return;
    }
    
    console.log('成功连接到数据库');
    
    // 列出所有表
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error('获取表列表失败:', err.message);
        db.close();
        rl.close();
        return;
      }
      
      console.log('\n数据库中的表:');
      tables.forEach(table => {
        console.log(`- ${table.name}`);
      });
      
      // 检查用户表
      if (tables.some(t => t.name === 'users')) {
        db.all('SELECT * FROM users', [], (err, users) => {
          if (err) {
            console.error('查询用户表失败:', err.message);
          } else {
            console.log(`\n找到 ${users.length} 个用户:`);
            users.forEach(user => {
              console.log(`- ID: ${user.id}, 用户名: ${user.username}, 密码是否存在: ${!!user.password}`);
            });
          }
          db.close();
          rl.close();
        });
      } else {
        console.log('\n用户表不存在');
        db.close();
        rl.close();
      }
    });
  });
}); 