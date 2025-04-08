require('dotenv').config();

// 确保 PORT 是数字类型
const PORT = parseInt(process.env.PORT || '3001', 10);

// 为测试环境提供不同的端口
const TEST_PORT = parseInt(process.env.TEST_PORT || '3002', 10);

// 导出配置
module.exports = {
    PORT: process.env.NODE_ENV === 'test' ? TEST_PORT : PORT,
    DIFY_API_KEY: process.env.DIFY_API_KEY || 'app-frrUU7gB8BnlhvAGl5AH9Coh',
    DIFY_API_URL: process.env.DIFY_API_URL || 'https://api.dify.ai'
};