/**
 * API连接测试工具
 * 用于测试前端与后端API的连接是否正常
 */

// API连接测试工具 - 使用原生fetch进行测试

/**
 * 测试API连接
 * @returns Promise<boolean> 连接是否成功
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log('🔍 测试API连接...');
    console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);

    // 测试健康检查接口
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '')}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API连接成功!');
      console.log('服务器状态:', data);
      return true;
    } else {
      console.error('❌ API连接失败:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ API连接失败:', error);
    return false;
  }
}

/**
 * 测试认证接口
 * @returns Promise<boolean> 接口是否可用
 */
export async function testAuthApi(): Promise<boolean> {
  try {
    console.log('🔍 测试认证接口...');
    
    // 测试发送验证码接口（不实际发送，只测试接口是否存在）
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: '13800138000' })
    });
    
    // 即使返回错误，只要不是404，说明接口存在
    if (response.status !== 404) {
      console.log('✅ 认证接口可用!');
      return true;
    } else {
      console.error('❌ 认证接口不存在');
      return false;
    }
  } catch (error) {
    console.error('❌ 认证接口测试失败:', error);
    return false;
  }
}

/**
 * 测试资源接口
 * @returns Promise<boolean> 接口是否可用
 */
export async function testResourceApi(): Promise<boolean> {
  try {
    console.log('🔍 测试资源接口...');
    
    // 测试获取资源列表接口
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/resources?pageNum=1&pageSize=10`);
    
    if (response.status !== 404) {
      console.log('✅ 资源接口可用!');
      return true;
    } else {
      console.error('❌ 资源接口不存在');
      return false;
    }
  } catch (error) {
    console.error('❌ 资源接口测试失败:', error);
    return false;
  }
}

/**
 * 测试VIP接口
 * @returns Promise<boolean> 接口是否可用
 */
export async function testVipApi(): Promise<boolean> {
  try {
    console.log('🔍 测试VIP接口...');
    
    // 测试获取VIP套餐列表接口
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vip/packages`);
    
    if (response.status !== 404) {
      console.log('✅ VIP接口可用!');
      return true;
    } else {
      console.error('❌ VIP接口不存在');
      return false;
    }
  } catch (error) {
    console.error('❌ VIP接口测试失败:', error);
    return false;
  }
}

/**
 * 测试积分接口
 * @returns Promise<boolean> 接口是否可用
 */
export async function testPointsApi(): Promise<boolean> {
  try {
    console.log('🔍 测试积分接口...');
    
    // 测试获取积分充值套餐接口
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/points/recharge-packages`);
    
    // 401表示需要登录，说明接口存在
    if (response.status !== 404) {
      console.log('✅ 积分接口可用!');
      return true;
    } else {
      console.error('❌ 积分接口不存在');
      return false;
    }
  } catch (error) {
    console.error('❌ 积分接口测试失败:', error);
    return false;
  }
}

/**
 * 运行所有API测试
 * @returns Promise<{ success: boolean; results: Record<string, boolean> }>
 */
export async function runAllApiTests(): Promise<{
  success: boolean;
  results: Record<string, boolean>;
}> {
  console.log('🚀 开始API连接测试...\n');

  const results = {
    connection: await testApiConnection(),
    auth: await testAuthApi(),
    resource: await testResourceApi(),
    vip: await testVipApi(),
    points: await testPointsApi(),
  };

  const success = Object.values(results).every((result) => result);

  console.log('\n📊 测试结果汇总:');
  console.log('- API连接:', results.connection ? '✅' : '❌');
  console.log('- 认证接口:', results.auth ? '✅' : '❌');
  console.log('- 资源接口:', results.resource ? '✅' : '❌');
  console.log('- VIP接口:', results.vip ? '✅' : '❌');
  console.log('- 积分接口:', results.points ? '✅' : '❌');
  console.log('\n总体结果:', success ? '✅ 所有测试通过' : '❌ 部分测试失败');

  return { success, results };
}

// 如果直接运行此文件，执行所有测试
if (import.meta.env.DEV) {
  // 在开发环境下，可以在控制台调用 window.testApi() 来运行测试
  (window as any).testApi = runAllApiTests;
  console.log('💡 提示: 在浏览器控制台输入 window.testApi() 可运行API连接测试');
}
