require('dotenv').config();
const path = require('path');

// 确保 PORT 是数字类型
const PORT = parseInt(process.env.PORT || '3001', 10);

// 为测试环境提供不同的端口
const TEST_PORT = parseInt(process.env.TEST_PORT || '3002', 10);

// 房间配置
const ROOM_CONFIG = {
  DEFAULT_MAX_PLAYERS: 10,
  DEFAULT_QUESTION_COUNT: 10,
  DEFAULT_TIME_PER_QUESTION: 30,
  ROOM_ID_LENGTH: 6,
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24小时
};

// 使用绝对路径
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');

// 显示实际使用的路径
console.log('配置的数据库路径:', DB_PATH);

// 导出配置
module.exports = {
    PORT: process.env.NODE_ENV === 'test' ? TEST_PORT : PORT,
    JWT_SECRET: process.env.JWT_SECRET || 'Ala/+a9Nwbtum16RqHi6h855BqnvLis11Fq1aYqGkoI=',
    DIFY_API_KEY: process.env.DIFY_API_KEY || 'app-frrUU7gB8BnlhvAGl5AH9Coh',
    DIFY_API_URL: process.env.DIFY_API_URL || 'https://api.dify.ai',
    DB_PATH,  // 确保导出 DB_PATH
    REQUIRE_AUTH: process.env.REQUIRE_AUTH === 'true' || false,
    ROOM_CONFIG,
};