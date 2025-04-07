#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 检查进程使用的文件
console.log('检查正在运行的 Node.js 进程...');

try {
  // 获取所有 Node.js 进程
  const processes = execSync('ps aux | grep node').toString().split('\n');
  
  // 过滤出可能是我们应用的进程
  const appProcesses = processes.filter(p => 
    p.includes('server.js') || 
    p.includes('app.js') || 
    p.includes('index.js')
  );
  
  if (appProcesses.length > 0) {
    console.log('找到可能的应用进程:');
    appProcesses.forEach(p => console.log(p));
    
    // 获取进程 ID
    const pidMatch = appProcesses[0].match(/\s+(\d+)\s+/);
    if (pidMatch && pidMatch[1]) {
      const pid = pidMatch[1];
      console.log(`\n检查进程 ID: ${pid} 打开的文件...`);
      
      try {
        const openFiles = execSync(`lsof -p ${pid}`).toString().split('\n');
        const dbFiles = openFiles.filter(f => 
          f.includes('.db') || 
          f.includes('.sqlite') || 
          f.includes('.sqlite3')
        );
        
        if (dbFiles.length > 0) {
          console.log('找到打开的数据库文件:');
          dbFiles.forEach(f => console.log(f));
        } else {
          console.log('未找到打开的数据库文件');
        }
      } catch (error) {
        console.log('无法获取进程打开的文件:', error.message);
      }
    }
  } else {
    console.log('未找到应用进程');
  }
} catch (error) {
  console.log('检查进程失败:', error.message);
}

// 搜索整个项目目录中的 SQLite 数据库文件
console.log('\n搜索项目中的所有数据库文件...');

function findDatabaseFiles(dir, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return [];
  
  let results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    if (item === 'node_modules' || item === '.git') continue;
    
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      results = results.concat(findDatabaseFiles(itemPath, depth + 1, maxDepth));
    } else if (
      item.endsWith('.db') || 
      item.endsWith('.sqlite') || 
      item.endsWith('.sqlite3')
    ) {
      // 检查文件大小和修改时间
      results.push({
        path: itemPath,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        mtime: stats.mtime
      });
    }
  }
  
  return results;
}

// 从当前目录向上查找项目根目录
let projectRoot = __dirname;
while (!fs.existsSync(path.join(projectRoot, 'package.json')) && projectRoot !== '/') {
  projectRoot = path.dirname(projectRoot);
}

if (projectRoot === '/') {
  console.log('无法找到项目根目录');
} else {
  console.log('项目根目录:', projectRoot);
  const dbFiles = findDatabaseFiles(projectRoot);
  
  if (dbFiles.length > 0) {
    console.log('\n找到的数据库文件:');
    dbFiles.forEach(file => {
      console.log(`- ${file.path} (${file.size}, 修改时间: ${file.mtime})`);
      
      // 尝试检查文件内容
      try {
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(file.path, sqlite3.OPEN_READONLY);
        
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
          if (err) {
            console.log(`  无法读取表结构: ${err.message}`);
          } else {
            console.log(`  包含的表: ${tables.map(t => t.name).join(', ')}`);
            
            // 检查是否有用户表
            if (tables.some(t => t.name === 'users')) {
              db.all('SELECT COUNT(*) as count FROM users', [], (err, result) => {
                if (err) {
                  console.log(`  无法读取用户表: ${err.message}`);
                } else {
                  console.log(`  用户表中有 ${result[0].count} 条记录`);
                  
                  // 检查是否有 gg 用户
                  db.get('SELECT * FROM users WHERE username = ?', ['gg'], (err, user) => {
                    if (err) {
                      console.log(`  无法查询用户: ${err.message}`);
                    } else if (user) {
                      console.log(`  找到用户 gg! ID: ${user.id}, 密码是否存在: ${!!user.password}`);
                      console.log(`  这可能是应用程序使用的数据库!`);
                    }
                    db.close();
                  });
                }
              });
            } else {
              db.close();
            }
          }
        });
      } catch (error) {
        console.log(`  无法连接到数据库: ${error.message}`);
      }
    });
  } else {
    console.log('未找到数据库文件');
  }
} 