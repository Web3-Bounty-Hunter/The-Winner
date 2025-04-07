// 从 routes/auth.js 导入认证中间件
const { authenticateToken } = require('../routes/auth');

module.exports = {
  authenticateToken
}; 