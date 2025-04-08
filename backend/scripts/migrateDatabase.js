#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 用于更新数据库表结构
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到数据库
const dbPath = path.join(__dirname, '../database.sqlite');
console.log(`连接到数据库: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

// 添加 weight 字段到 questions 表
db.run(`
  ALTER TABLE questions 
  ADD COLUMN weight INTEGER DEFAULT 0
`);

// 添加 weight 列到 questions 表
function addWeightColumn() {
  return new Promise((resolve, reject) => {
    // 首先检查列是否已存在
    db.all("PRAGMA table_info(questions)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 检查是否已有 weight 列
      const hasWeightColumn = rows && rows.some(row => row.name === 'weight');
      
      if (hasWeightColumn) {
        console.log('weight 列已存在，无需添加');
        resolve();
        return;
      }
      
      // 添加 weight 列
      db.run(`ALTER TABLE questions ADD COLUMN weight INTEGER DEFAULT 0`, (err) => {
        if (err) {
          console.error('添加 weight 列失败:', err.message);
          reject(err);
        } else {
          console.log('成功添加 weight 列到 questions 表');
          resolve();
        }
      });
    });
  });
}

// 执行迁移
async function migrate() {
  try {
    await addWeightColumn();
    console.log('数据库迁移完成');
  } catch (error) {
    console.error('数据库迁移失败:', error);
  } finally {
    db.close();
  }
}

migrate(); 