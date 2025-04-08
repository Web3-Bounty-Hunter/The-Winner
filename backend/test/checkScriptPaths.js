#!/usr/bin/env node

/**
 * 检查脚本路径是否正确
 */

const fs = require('fs');
const path = require('path');

// 检查脚本路径
const scriptsDir = path.join(__dirname, '../scripts');
const generateScriptPath = path.join(scriptsDir, 'generateQuestions.js');
const checkScriptPath = path.join(scriptsDir, 'checkQuestions.js');

console.log('脚本目录:', scriptsDir);
console.log('生成脚本路径:', generateScriptPath);
console.log('检查脚本路径:', checkScriptPath);

// 检查文件是否存在
console.log('生成脚本存在:', fs.existsSync(generateScriptPath));
console.log('检查脚本存在:', fs.existsSync(checkScriptPath));

// 检查文件权限
try {
  fs.accessSync(generateScriptPath, fs.constants.X_OK);
  console.log('生成脚本可执行');
} catch (err) {
  console.log('生成脚本不可执行:', err.message);
}

try {
  fs.accessSync(checkScriptPath, fs.constants.X_OK);
  console.log('检查脚本可执行');
} catch (err) {
  console.log('检查脚本不可执行:', err.message);
}

// 检查数据库路径
const dbPath = path.join(__dirname, '../questions.db');
console.log('数据库路径:', dbPath);
console.log('数据库存在:', fs.existsSync(dbPath)); 