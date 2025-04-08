const express = require('express');
const cors = require('cors');
const { initWebSocket } = require('./websocket');
const questionsRoutes = require('./questions');
const { PORT } = require('./config');
const { createQuestionsTable } = require('./database');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/questions', questionsRoutes);

// 创建数据库表
createQuestionsTable();

let server;

// 只在非测试环境下自动启动服务器
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`HTTP Server is running on port ${PORT}`);
  });
  
  initWebSocket(server);
}

// 导出启动和关闭服务器的函数
module.exports = {
  app,
  start: (port = PORT) => {
    if (!server) {
      server = app.listen(port);
      initWebSocket(server);
    }
    return server;
  },
  close: () => {
    if (server) {
      server.close();
      server = null;
    }
  }
};