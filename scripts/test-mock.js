/**
 * Mock服务测试脚本
 * 用于验证Mock服务是否正常工作
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

const tests = [
  {
    name: '获取网站配置',
    url: `${BASE_URL}/config/site`,
    method: 'GET'
  },
  {
    name: '获取轮播图',
    url: `${BASE_URL}/config/banners`,
    method: 'GET'
  },
  {
    name: '获取分类列表',
    url: `${BASE_URL}/config/categories`,
    method: 'GET'
  },
  {
    name: '获取公告列表',
    url: `${BASE_URL}/config/announcements`,
    method: 'GET'
  },
  {
    name: '获取热门资源',
    url: `${BASE_URL}/content/hot-search?limit=10`,
    method: 'GET'
  },
  {
    name: '获取推荐资源',
    url: `${BASE_URL}/content/recommended?limit=10`,
    method: 'GET'
  },
  {
    name: '搜索资源',
    url: `${BASE_URL}/content/search?keyword=UI`,
    method: 'GET'
  }
];

async function runTests() {
  console.log('🚀 开始测试Mock服务...\n');
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const test of tests) {
    try {
      console.log(`📝 测试: ${test.name}`);
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000
      });
      
      if (response.status === 200 && response.data.code === 200) {
        console.log(`✅ 通过 - 状态码: ${response.status}, 响应码: ${response.data.code}`);
        console.log(`   消息: ${response.data.msg}`);
        passedCount++;
      } else {
        console.log(`❌ 失败 - 状态码: ${response.status}, 响应码: ${response.data.code}`);
        console.log(`   错误: ${response.data.msg}`);
        failedCount++;
      }
    } catch (error) {
      console.log(`❌ 失败 - ${error.message}`);
      if (error.response) {
        console.log(`   HTTP状态: ${error.response.status}`);
        console.log(`   响应数据:`, error.response.data);
      } else if (error.request) {
        console.log(`   无响应 - 可能是网络错误或服务未启动`);
      }
      failedCount++;
    }
    console.log('');
  }
  
  console.log('='.repeat(50));
  console.log(`📊 测试结果: ${passedCount} 通过, ${failedCount} 失败`);
  console.log('='.repeat(50));
  
  if (failedCount === 0) {
    console.log('🎉 所有测试通过！Mock服务工作正常。');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查Mock服务配置。');
    process.exit(1);
  }
}

// 等待服务器启动
console.log('⏳ 等待开发服务器启动...');
setTimeout(() => {
  runTests().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  });
}, 2000);
