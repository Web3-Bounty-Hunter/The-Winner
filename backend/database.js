const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 根据环境使用不同的数据库文件
const dbFile = process.env.NODE_ENV === 'test' ? 'test-questions.db' : 'questions.db';
const db = new sqlite3.Database(path.join(__dirname, dbFile));

function createQuestionsTable() {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                options TEXT NOT NULL,
                correctAnswer TEXT NOT NULL,
                explanation TEXT NOT NULL,
                source TEXT NOT NULL,
                territoryId TEXT NOT NULL,
                difficulty TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error("创建表失败:", err.message);
                reject(err);
            } else {
                console.log("questions 表创建成功或已存在");
                resolve();
            }
        });
    });
}

module.exports = {
    db,
    createQuestionsTable
};