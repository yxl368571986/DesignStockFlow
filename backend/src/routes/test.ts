import { Router, Request, Response } from 'express';

const router = Router();

/**
 * 测试字段名转换
 * POST /api/test/field-transform
 */
router.post('/field-transform', (req: Request, res: Response) => {
  // 接收前端的camelCase数据，中间件会自动转换为snake_case
  const requestData = req.body;

  // 模拟数据库返回的snake_case数据
  const responseData = {
    user_id: '12345',
    user_name: 'Test User',
    created_at: new Date().toISOString(),
    vip_level: 1,
    vip_expire_time: '2025-12-31 23:59:59',
    download_count: 100,
    nested_object: {
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '13800138000',
    },
    array_data: [
      { resource_id: '1', resource_name: 'Resource 1' },
      { resource_id: '2', resource_name: 'Resource 2' },
    ],
  };

  res.json({
    code: 200,
    msg: '字段转换测试成功',
    data: {
      received_data: requestData, // 显示接收到的数据（已转换为snake_case）
      response_data: responseData, // 将被转换为camelCase返回给前端
    },
  });
});

/**
 * 测试请求日志
 * GET /api/test/logging
 */
router.get('/logging', (_req: Request, res: Response) => {
  res.json({
    code: 200,
    msg: '日志测试成功',
    data: {
      message: '此请求已被记录到日志文件',
    },
  });
});

/**
 * 测试错误处理
 * GET /api/test/error
 */
router.get('/error', (_req: Request, _res: Response) => {
  throw new Error('这是一个测试错误');
});

export default router;
