#!/usr/bin/env node

/**
 * 检查应用程序使用的数据库路径
 */

const path = require('path');
const fs = require('fs');

// 可能的数据库文件名
const possibleDbNames = ['database.sqlite', 'questions.db', 'blockchain.db'];

// 检查项目根目录
const projectRoot = path.join(__dirname, '../..');
console.log('项目根目录:', projectRoot);

// 检查后端目录
const backendDir = path.join(__dirname, '..');
console.log('后端目录:', backendDir);

// 检查可能的数据库文件
console.log('\n可能的数据库文件:');

// 检查后端目录中的数据库文件
possibleDbNames.forEach(dbName => {
  const dbPath = path.join(backendDir, dbName);
  const exists = fs.existsSync(dbPath);
  const size = exists ? fs.statSync(dbPath).size : 0;
  console.log(`${dbPath}: ${exists ? '存在' : '不存在'} (${size} 字节)`);
});

// 检查项目根目录中的数据库文件
possibleDbNames.forEach(dbName => {
  const dbPath = path.join(projectRoot, dbName);
  const exists = fs.existsSync(dbPath);
  const size = exists ? fs.statSync(dbPath).size : 0;
  console.log(`${dbPath}: ${exists ? '存在' : '不存在'} (${size} 字节)`);
});

// 检查 database.js 文件
const databaseJsPath = path.join(backendDir, 'database.js');
if (fs.existsSync(databaseJsPath)) {
  const content = fs.readFileSync(databaseJsPath, 'utf8');
  console.log('\ndatabase.js 文件内容:');
  
  // 查找数据库路径相关代码
  const dbPathMatches = content.match(/new\s+sqlite3\.Database\(([^)]+)\)/g);
  if (dbPathMatches) {
    console.log('找到数据库连接代码:');
    dbPathMatches.forEach(match => {
      console.log(`- ${match}`);
    });
  } else {
    console.log('未找到数据库连接代码');
  }
} 