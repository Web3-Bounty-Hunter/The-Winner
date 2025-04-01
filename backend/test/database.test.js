const assert = require('assert');
const { db, createQuestionsTable } = require('../database');

describe('Database Tests', () => {
    it('should create questions table', async () => {
        await createQuestionsTable();
        const row = await new Promise((resolve) => {
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'", (err, row) => {
                resolve(row);
            });
        });
        assert.strictEqual(row.name, 'questions');
    });

    it('should insert and retrieve a question', async () => {
        await createQuestionsTable();
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO questions (text, options, correctAnswer, explanation, source, territoryId, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['What is 2+2?', '["2","4","6","8"]', '4', '2+2 equals 4', 'test', 'math', 'easy'],
                (err) => (err ? reject(err) : resolve())
            );
        });

        const question = await new Promise((resolve) => {
            db.get('SELECT * FROM questions WHERE text = ?', ['What is 2+2?'], (err, row) => {
                resolve(row);
            });
        });
        assert.strictEqual(question.correctAnswer, '4');
        assert.strictEqual(JSON.parse(question.options)[1], '4');
    });
});