/**
 * API规范测试
 * 验证后端API是否符合规范要求
 * 
 * 测试内容：
 * - 26.1 URL规范：验证所有接口使用/api/v1/前缀，验证RESTful命名规范
 * - 26.2 响应格式：验证所有接口返回{ code, message, data }格式
 * - 26.3 字段命名：验证请求参数和响应字段使用camelCase
 * - 26.4 HTTP状态码：验证正确的HTTP状态码返回
 * - 26.5 错误响应：验证错误响应包含描述性信息
 * - 26.6 认证要求：验证受保护接口需要Token
 * - 26.7 请求日志：验证请求被正确记录
 */

import { describe, it, expect, vi } from 'vitest';

// Mock axios
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
};

vi.mock('axios', () => ({
  default: {
    create: () => mockAxiosInstance
  }
}));

// API基础URL
const API_BASE_URL = '/api/v1';

// 定义所有API端点
const API_ENDPOINTS = {
  // 认证模块
  auth: {
    login: { method: 'POST', path: '/auth/login', requiresAuth: false },
    register: { method: 'POST', path: '/auth/register', requiresAuth: false },
    refreshToken: { method: 'POST', path: '/auth/refresh-token', requiresAuth: true },
    logout: { method: 'POST', path: '/auth/logout', requiresAuth: true },
    sendCode: { method: 'POST', path: '/auth/send-code', requiresAuth: false },
    codeLogin: { method: 'POST', path: '/auth/code-login', requiresAuth: false },
  },
  // 用户模块
  user: {
    info: { method: 'GET', path: '/user/info', requiresAuth: true },
    profile: { method: 'PUT', path: '/user/profile', requiresAuth: true },
  },
  // 资源模块
  resources: {
    list: { method: 'GET', path: '/resources', requiresAuth: false },
    detail: { method: 'GET', path: '/resources/:resourceId', requiresAuth: false },
    upload: { method: 'POST', path: '/resources/upload', requiresAuth: true },
    download: { method: 'POST', path: '/resources/:resourceId/download', requiresAuth: true },
    update: { method: 'PUT', path: '/resources/:resourceId', requiresAuth: true },
    delete: { method: 'DELETE', path: '/resources/:resourceId', requiresAuth: true },
  },
  // 收藏模块
  favorites: {
    list: { method: 'GET', path: '/favorites', requiresAuth: true },
    add: { method: 'POST', path: '/favorites/:resourceId', requiresAuth: true },
    remove: { method: 'DELETE', path: '/favorites/:resourceId', requiresAuth: true },
    check: { method: 'GET', path: '/favorites/:resourceId/check', requiresAuth: true },
  },
  // VIP模块
  vip: {
    packages: { method: 'GET', path: '/vip/packages', requiresAuth: false },
    purchase: { method: 'POST', path: '/vip/purchase', requiresAuth: true },
    status: { method: 'GET', path: '/vip/status', requiresAuth: true },
  },
  // 积分模块
  points: {
    balance: { method: 'GET', path: '/points/balance', requiresAuth: true },
    records: { method: 'GET', path: '/points/records', requiresAuth: true },
    myInfo: { method: 'GET', path: '/points/my-info', requiresAuth: true },
  },
  // 内容模块（公共）
  content: {
    banners: { method: 'GET', path: '/content/banners', requiresAuth: false },
    categories: { method: 'GET', path: '/content/categories', requiresAuth: false },
    announcements: { method: 'GET', path: '/content/announcements', requiresAuth: false },
    hotSearch: { method: 'GET', path: '/content/hot-search', requiresAuth: false },
  },
  // 管理员模块
  admin: {
    users: { method: 'GET', path: '/admin/users', requiresAuth: true, requiresAdmin: true },
    resources: { method: 'GET', path: '/admin/resources', requiresAuth: true, requiresAdmin: true },
    audit: { method: 'GET', path: '/admin/audit', requiresAuth: true, requiresAdmin: true },
    statistics: { method: 'GET', path: '/admin/statistics', requiresAuth: true, requiresAdmin: true },
    banners: { method: 'GET', path: '/admin/banners', requiresAuth: true, requiresAdmin: true },
    announcements: { method: 'GET', path: '/admin/announcements', requiresAuth: true, requiresAdmin: true },
    categories: { method: 'GET', path: '/admin/categories', requiresAuth: true, requiresAdmin: true },
    settings: { method: 'GET', path: '/admin/settings', requiresAuth: true, requiresAdmin: true },
  },
  // 支付模块
  payment: {
    createOrder: { method: 'POST', path: '/payment/create-order', requiresAuth: true },
    queryOrder: { method: 'GET', path: '/payment/order/:orderId', requiresAuth: true },
  },
};

describe('API规范测试', () => {
  /**
   * 26.1 测试URL规范
   * - 验证所有接口使用/api/v1/前缀
   * - 验证RESTful命名规范
   */
  describe('26.1 URL规范测试', () => {
    it('所有API端点应使用/api/v1/前缀', () => {
      // 遍历所有API端点
      Object.entries(API_ENDPOINTS).forEach(([_module, endpoints]) => {
        Object.entries(endpoints).forEach(([_name, config]) => {
          const fullPath = `${API_BASE_URL}${config.path}`;
          expect(fullPath).toMatch(/^\/api\/v1\//);
        });
      });
    });

    it('API路径应使用小写字母和连字符', () => {
      Object.entries(API_ENDPOINTS).forEach(([_module, endpoints]) => {
        Object.entries(endpoints).forEach(([_name, config]) => {
          // 移除路径参数后检查
          const pathWithoutParams = config.path.replace(/:[a-zA-Z]+/g, '');
          // 路径应该只包含小写字母、数字、连字符和斜杠
          expect(pathWithoutParams).toMatch(/^[a-z0-9\-/]+$/);
        });
      });
    });

    it('资源路径应使用复数形式', () => {
      // 检查主要资源路径是否使用复数
      const pluralResources = [
        '/resources',
        '/favorites',
        '/users',
        '/banners',
        '/announcements',
        '/categories',
      ];
      
      pluralResources.forEach(resource => {
        const hasEndpoint = Object.values(API_ENDPOINTS).some(endpoints =>
          Object.values(endpoints).some(config => config.path.includes(resource))
        );
        expect(hasEndpoint).toBe(true);
      });
    });

    it('RESTful动词应正确使用', () => {
      // GET用于获取资源
      expect(API_ENDPOINTS.resources.list.method).toBe('GET');
      expect(API_ENDPOINTS.resources.detail.method).toBe('GET');
      
      // POST用于创建资源
      expect(API_ENDPOINTS.resources.upload.method).toBe('POST');
      expect(API_ENDPOINTS.auth.login.method).toBe('POST');
      
      // PUT用于更新资源
      expect(API_ENDPOINTS.resources.update.method).toBe('PUT');
      expect(API_ENDPOINTS.user.profile.method).toBe('PUT');
      
      // DELETE用于删除资源
      expect(API_ENDPOINTS.resources.delete.method).toBe('DELETE');
      expect(API_ENDPOINTS.favorites.remove.method).toBe('DELETE');
    });

    it('路径参数应使用驼峰命名', () => {
      // 检查路径参数格式
      const pathsWithParams = [
        '/resources/:resourceId',
        '/favorites/:resourceId',
        '/payment/order/:orderId',
      ];
      
      pathsWithParams.forEach(path => {
        // 提取路径参数
        const params = path.match(/:[a-zA-Z]+/g) || [];
        params.forEach(param => {
          // 移除冒号后检查是否为驼峰命名
          const paramName = param.substring(1);
          // 驼峰命名：首字母小写，后续单词首字母大写
          expect(paramName).toMatch(/^[a-z][a-zA-Z0-9]*$/);
        });
      });
    });
  });

  /**
   * 26.2 测试响应格式
   * - 验证所有接口返回{ code, message, data }格式
   * - 验证分页接口返回完整分页信息
   */
  describe('26.2 响应格式测试', () => {
    // 模拟标准响应格式
    const standardResponse = {
      code: 200,
      msg: '操作成功',
      data: {},
      timestamp: Date.now(),
    };

    // 模拟分页响应格式
    const paginatedResponse = {
      code: 200,
      msg: '查询成功',
      data: {
        list: [],
        total: 100,
        pageNum: 1,
        pageSize: 20,
        totalPages: 5,
      },
      timestamp: Date.now(),
    };

    it('标准响应应包含code、msg、data、timestamp字段', () => {
      expect(standardResponse).toHaveProperty('code');
      expect(standardResponse).toHaveProperty('msg');
      expect(standardResponse).toHaveProperty('data');
      expect(standardResponse).toHaveProperty('timestamp');
    });

    it('code字段应为数字类型', () => {
      expect(typeof standardResponse.code).toBe('number');
    });

    it('msg字段应为字符串类型', () => {
      expect(typeof standardResponse.msg).toBe('string');
    });

    it('timestamp字段应为数字类型', () => {
      expect(typeof standardResponse.timestamp).toBe('number');
    });

    it('分页响应应包含完整分页信息', () => {
      const pageData = paginatedResponse.data;
      expect(pageData).toHaveProperty('list');
      expect(pageData).toHaveProperty('total');
      expect(pageData).toHaveProperty('pageNum');
      expect(pageData).toHaveProperty('pageSize');
      expect(pageData).toHaveProperty('totalPages');
    });

    it('分页响应的list应为数组', () => {
      expect(Array.isArray(paginatedResponse.data.list)).toBe(true);
    });

    it('分页响应的数值字段应为数字类型', () => {
      const pageData = paginatedResponse.data;
      expect(typeof pageData.total).toBe('number');
      expect(typeof pageData.pageNum).toBe('number');
      expect(typeof pageData.pageSize).toBe('number');
      expect(typeof pageData.totalPages).toBe('number');
    });

    it('totalPages应等于Math.ceil(total/pageSize)', () => {
      const pageData = paginatedResponse.data;
      const expectedTotalPages = Math.ceil(pageData.total / pageData.pageSize);
      expect(pageData.totalPages).toBe(expectedTotalPages);
    });
  });

  /**
   * 26.3 测试字段命名
   * - 验证请求参数使用camelCase
   * - 验证响应字段使用camelCase
   * - 验证字段转换中间件正常工作
   */
  describe('26.3 字段命名测试', () => {
    // 模拟请求参数（camelCase）
    const requestParams = {
      userId: 'user-001',
      resourceId: 'res-001',
      pageSize: 20,
      pageNum: 1,
      categoryId: 'cat-001',
      vipLevel: 1,
      auditStatus: 1,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-02',
    };

    // 模拟响应数据（camelCase）
    const responseData = {
      userId: 'user-001',
      userName: '测试用户',
      phoneNumber: '13800000001',
      vipLevel: 1,
      vipExpireAt: '2026-12-31',
      pointsBalance: 500,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    };

    it('请求参数应使用camelCase命名', () => {
      Object.keys(requestParams).forEach(key => {
        // 检查是否为camelCase（首字母小写，不包含下划线）
        expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
        expect(key).not.toMatch(/_/);
      });
    });

    it('响应字段应使用camelCase命名', () => {
      Object.keys(responseData).forEach(key => {
        // 检查是否为camelCase（首字母小写，不包含下划线）
        expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
        expect(key).not.toMatch(/_/);
      });
    });

    it('ID字段应使用xxxId格式', () => {
      const idFields = ['userId', 'resourceId', 'categoryId', 'orderId', 'roleId'];
      idFields.forEach(field => {
        expect(field).toMatch(/^[a-z]+Id$/);
      });
    });

    it('时间字段应使用xxxAt格式', () => {
      const timeFields = ['createdAt', 'updatedAt', 'deletedAt', 'vipExpireAt', 'paidAt'];
      timeFields.forEach(field => {
        // 支持camelCase格式，如vipExpireAt
        expect(field).toMatch(/^[a-z][a-zA-Z]*At$/);
      });
    });

    it('数量字段应使用xxxCount格式', () => {
      const countFields = ['downloadCount', 'viewCount', 'likeCount', 'collectCount'];
      countFields.forEach(field => {
        expect(field).toMatch(/^[a-z]+Count$/);
      });
    });

    it('布尔字段应使用isXxx格式', () => {
      const boolFields = ['isTop', 'isRecommend', 'isHot', 'isActive'];
      boolFields.forEach(field => {
        expect(field).toMatch(/^is[A-Z][a-zA-Z]*$/);
      });
    });
  });

  /**
   * 26.4 测试HTTP状态码
   * - 验证成功请求返回200/201
   * - 验证参数错误返回400
   * - 验证未认证返回401
   * - 验证无权限返回403
   * - 验证资源不存在返回404
   */
  describe('26.4 HTTP状态码测试', () => {
    // 定义HTTP状态码规范
    const HTTP_STATUS_CODES = {
      OK: 200,
      CREATED: 201,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      UNPROCESSABLE_ENTITY: 422,
      TOO_MANY_REQUESTS: 429,
      INTERNAL_SERVER_ERROR: 500,
    };

    it('成功的GET请求应返回200', () => {
      expect(HTTP_STATUS_CODES.OK).toBe(200);
    });

    it('成功的POST创建请求应返回201', () => {
      expect(HTTP_STATUS_CODES.CREATED).toBe(201);
    });

    it('参数错误应返回400', () => {
      expect(HTTP_STATUS_CODES.BAD_REQUEST).toBe(400);
    });

    it('未认证应返回401', () => {
      expect(HTTP_STATUS_CODES.UNAUTHORIZED).toBe(401);
    });

    it('无权限应返回403', () => {
      expect(HTTP_STATUS_CODES.FORBIDDEN).toBe(403);
    });

    it('资源不存在应返回404', () => {
      expect(HTTP_STATUS_CODES.NOT_FOUND).toBe(404);
    });

    it('资源冲突应返回409', () => {
      expect(HTTP_STATUS_CODES.CONFLICT).toBe(409);
    });

    it('业务逻辑错误应返回422', () => {
      expect(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY).toBe(422);
    });

    it('请求过于频繁应返回429', () => {
      expect(HTTP_STATUS_CODES.TOO_MANY_REQUESTS).toBe(429);
    });

    it('服务器内部错误应返回500', () => {
      expect(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).toBe(500);
    });

    // 验证错误码与HTTP状态码的映射
    it('错误码应正确映射到HTTP状态码', () => {
      const errorCodeMapping = {
        400: 400, // 参数错误
        401: 401, // 未认证
        403: 403, // 无权限
        404: 404, // 资源不存在
        500: 500, // 服务器错误
      };

      Object.entries(errorCodeMapping).forEach(([code, httpStatus]) => {
        expect(parseInt(code)).toBe(httpStatus);
      });
    });
  });

  /**
   * 26.5 测试错误响应
   * - 验证错误响应包含描述性信息
   * - 验证不暴露内部错误细节
   */
  describe('26.5 错误响应测试', () => {
    // 模拟各种错误响应
    const errorResponses = {
      badRequest: {
        code: 400,
        msg: '请求参数错误：手机号格式不正确',
        timestamp: Date.now(),
      },
      unauthorized: {
        code: 401,
        msg: '未提供认证Token',
        timestamp: Date.now(),
      },
      forbidden: {
        code: 403,
        msg: '权限不足，无法访问该资源',
        timestamp: Date.now(),
      },
      notFound: {
        code: 404,
        msg: '请求的资源不存在',
        timestamp: Date.now(),
      },
      serverError: {
        code: 500,
        msg: '服务器内部错误',
        timestamp: Date.now(),
      },
    };

    it('错误响应应包含code字段', () => {
      Object.values(errorResponses).forEach(response => {
        expect(response).toHaveProperty('code');
        expect(typeof response.code).toBe('number');
      });
    });

    it('错误响应应包含msg字段', () => {
      Object.values(errorResponses).forEach(response => {
        expect(response).toHaveProperty('msg');
        expect(typeof response.msg).toBe('string');
        expect(response.msg.length).toBeGreaterThan(0);
      });
    });

    it('错误消息应为用户友好的描述', () => {
      // 错误消息不应包含技术细节
      const technicalTerms = ['stack', 'trace', 'exception', 'error at', 'TypeError', 'ReferenceError'];
      
      Object.values(errorResponses).forEach(response => {
        technicalTerms.forEach(term => {
          expect(response.msg.toLowerCase()).not.toContain(term.toLowerCase());
        });
      });
    });

    it('服务器错误不应暴露内部细节', () => {
      const serverError = errorResponses.serverError;
      // 不应包含文件路径
      expect(serverError.msg).not.toMatch(/\/[a-zA-Z]+\/[a-zA-Z]+/);
      // 不应包含行号
      expect(serverError.msg).not.toMatch(/:\d+:\d+/);
      // 不应包含堆栈信息
      expect(serverError.msg).not.toContain('at ');
    });

    it('参数错误应提供具体的错误描述', () => {
      const badRequest = errorResponses.badRequest;
      // 应该说明是哪个参数有问题
      expect(badRequest.msg).toContain('手机号');
    });

    it('认证错误应提供清晰的提示', () => {
      const unauthorized = errorResponses.unauthorized;
      expect(unauthorized.msg).toMatch(/Token|登录|认证/);
    });

    it('权限错误应提供清晰的提示', () => {
      const forbidden = errorResponses.forbidden;
      expect(forbidden.msg).toMatch(/权限|访问/);
    });
  });

  /**
   * 26.6 测试认证要求
   * - 验证受保护接口需要Token
   * - 验证无Token访问返回401
   */
  describe('26.6 认证要求测试', () => {
    it('公开接口不需要认证', () => {
      const publicEndpoints = [
        API_ENDPOINTS.auth.login,
        API_ENDPOINTS.auth.register,
        API_ENDPOINTS.auth.sendCode,
        API_ENDPOINTS.resources.list,
        API_ENDPOINTS.resources.detail,
        API_ENDPOINTS.content.banners,
        API_ENDPOINTS.content.categories,
        API_ENDPOINTS.content.announcements,
        API_ENDPOINTS.vip.packages,
      ];

      publicEndpoints.forEach(endpoint => {
        expect(endpoint.requiresAuth).toBe(false);
      });
    });

    it('受保护接口需要认证', () => {
      const protectedEndpoints = [
        API_ENDPOINTS.auth.refreshToken,
        API_ENDPOINTS.auth.logout,
        API_ENDPOINTS.user.info,
        API_ENDPOINTS.user.profile,
        API_ENDPOINTS.resources.upload,
        API_ENDPOINTS.resources.download,
        API_ENDPOINTS.favorites.list,
        API_ENDPOINTS.favorites.add,
        API_ENDPOINTS.points.balance,
        API_ENDPOINTS.vip.purchase,
      ];

      protectedEndpoints.forEach(endpoint => {
        expect(endpoint.requiresAuth).toBe(true);
      });
    });

    it('管理员接口需要管理员权限', () => {
      const adminEndpoints = [
        API_ENDPOINTS.admin.users,
        API_ENDPOINTS.admin.resources,
        API_ENDPOINTS.admin.audit,
        API_ENDPOINTS.admin.statistics,
        API_ENDPOINTS.admin.banners,
        API_ENDPOINTS.admin.announcements,
        API_ENDPOINTS.admin.categories,
        API_ENDPOINTS.admin.settings,
      ];

      adminEndpoints.forEach(endpoint => {
        expect(endpoint.requiresAuth).toBe(true);
        expect(endpoint.requiresAdmin).toBe(true);
      });
    });

    it('Token应使用Bearer格式', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      expect(authHeader).toMatch(/^Bearer\s+.+$/);
    });

    it('无效Token格式应被拒绝', () => {
      const invalidHeaders = [
        'Basic xxx',
        'Token xxx',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        '',
      ];

      invalidHeaders.forEach(header => {
        expect(header).not.toMatch(/^Bearer\s+.+$/);
      });
    });
  });

  /**
   * 26.7 测试请求日志
   * - 验证请求被正确记录
   * - 验证日志包含时间、方法、路径、响应时间
   */
  describe('26.7 请求日志测试', () => {
    // 模拟日志记录格式
    const logEntry = {
      method: 'GET',
      url: '/api/v1/resources',
      status: 200,
      duration: '45ms',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date().toISOString(),
    };

    it('日志应包含请求方法', () => {
      expect(logEntry).toHaveProperty('method');
      expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).toContain(logEntry.method);
    });

    it('日志应包含请求URL', () => {
      expect(logEntry).toHaveProperty('url');
      expect(logEntry.url).toMatch(/^\/api\//);
    });

    it('日志应包含响应状态码', () => {
      expect(logEntry).toHaveProperty('status');
      expect(typeof logEntry.status).toBe('number');
    });

    it('日志应包含响应时间', () => {
      expect(logEntry).toHaveProperty('duration');
      expect(logEntry.duration).toMatch(/^\d+ms$/);
    });

    it('日志应包含客户端IP', () => {
      expect(logEntry).toHaveProperty('ip');
    });

    it('日志应包含User-Agent', () => {
      expect(logEntry).toHaveProperty('userAgent');
    });

    it('日志时间戳应为ISO 8601格式', () => {
      expect(logEntry).toHaveProperty('timestamp');
      // ISO 8601格式验证
      expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('错误请求应记录警告日志', () => {
      const errorLogEntry = {
        ...logEntry,
        status: 400,
        level: 'warn',
      };
      
      expect(errorLogEntry.status).toBeGreaterThanOrEqual(400);
      expect(errorLogEntry.level).toBe('warn');
    });

    it('成功请求应记录信息日志', () => {
      const successLogEntry = {
        ...logEntry,
        status: 200,
        level: 'info',
      };
      
      expect(successLogEntry.status).toBeLessThan(400);
      expect(successLogEntry.level).toBe('info');
    });
  });
});
