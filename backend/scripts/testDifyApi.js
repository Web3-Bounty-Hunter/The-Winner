#!/usr/bin/env node

/**
 * 测试 Dify API 响应
 */

const axios = require('axios');
require('dotenv').config();

const DIFY_API_KEY = process.env.DIFY_API_KEY || 'app-frrUU7gB8BnlhvAGl5AH9Coh';
const DIFY_API_URL = process.env.DIFY_API_URL || 'https://api.dify.ai';

async function testDifyApi() {
  try {
    const prompt = `请生成1道关于区块链基础的简单难度的区块链知识选择题，以JSON格式返回，包含question、options、correctAnswer和explanation字段。`;
    
    console.log('测试 Dify API...');
    console.log('提示词:', prompt);
    
    const response = await axios.post(
      `${DIFY_API_URL}/v1/chat-messages`,
      {
        inputs: {},
        query: prompt,
        response_mode: "blocking",
        user: "tester"
      },
      {
        headers: {
          'Authorization': `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('API 响应状态:', response.status);
    console.log('API 响应头:', JSON.stringify(response.headers, null, 2));
    console.log('API 响应数据:', JSON.stringify(response.data, null, 2));
    
    // 尝试解析响应中的 JSON
    if (response.data && response.data.answer) {
      try {
        const jsonMatch = response.data.answer.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedJson = JSON.parse(jsonMatch[0]);
          console.log('成功解析 JSON:', JSON.stringify(parsedJson, null, 2));
        } else {
          console.log('未找到 JSON 格式数据');
        }
      } catch (e) {
        console.log('解析 JSON 失败:', e.message);
      }
    }
  } catch (error) {
    console.error('API 请求失败:', error.message);
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
  }
}

testDifyApi(); 