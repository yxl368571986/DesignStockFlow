/**
 * Mock服务
 * 用于开发环境模拟后端API
 */

import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';
import {
  mockSiteConfig,
  mockBanners,
  mockCategories,
  mockAnnouncements,
  mockResources
} from './data';

/**
 * 初始化Mock服务
 * @param axiosInstance Axios实例
 */
export function setupMock(axiosInstance: AxiosInstance) {
  // 创建Mock适配器（延迟200-500ms模拟网络请求）
  const mock = new MockAdapter(axiosInstance, { delayResponse: 200 });

  console.log('🎭 Mock服务已启动');

  // ========== 网站配置相关 ==========

  // 获取网站配置
  mock.onGet('/config/site').reply(200, {
    code: 200,
    msg: '获取成功',
    data: mockSiteConfig
  });

  // 获取轮播图列表
  mock.onGet('/config/banners').reply(200, {
    code: 200,
    msg: '获取成功',
    data: mockBanners
  });

  // 获取分类列表
  mock.onGet('/config/categories').reply(200, {
    code: 200,
    msg: '获取成功',
    data: mockCategories
  });

  // 获取公告列表
  mock.onGet('/config/announcements').reply(200, {
    code: 200,
    msg: '获取成功',
    data: mockAnnouncements
  });

  // ========== 资源相关 ==========

  // 获取热门资源
  mock.onGet(/\/content\/hot-search/).reply((config) => {
    const limit = parseInt(config.params?.limit || '8');
    return [
      200,
      {
        code: 200,
        msg: '获取成功',
        data: mockResources.slice(0, limit)
      }
    ];
  });

  // 获取推荐资源
  mock.onGet(/\/content\/recommended/).reply((config) => {
    const limit = parseInt(config.params?.limit || '8');
    return [
      200,
      {
        code: 200,
        msg: '获取成功',
        data: mockResources.slice(0, limit)
      }
    ];
  });

  // 获取资源列表
  mock.onGet(/\/content\/resources/).reply((config) => {
    const page = parseInt(config.params?.page || '1');
    const pageSize = parseInt(config.params?.pageSize || '12');
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return [
      200,
      {
        code: 200,
        msg: '获取成功',
        data: {
          list: mockResources.slice(start, end),
          total: mockResources.length,
          page,
          pageSize
        }
      }
    ];
  });

  // 获取资源详情
  mock.onGet(/\/content\/resource\/\w+/).reply((config) => {
    const resourceId = config.url?.split('/').pop();
    const resource = mockResources.find((r) => r.resourceId === resourceId);

    if (resource) {
      return [
        200,
        {
          code: 200,
          msg: '获取成功',
          data: resource
        }
      ];
    } else {
      return [
        404,
        {
          code: 404,
          msg: '资源不存在',
          data: null
        }
      ];
    }
  });

  // 搜索资源
  mock.onGet(/\/content\/search/).reply((config) => {
    const keyword = config.params?.keyword || '';
    const filtered = mockResources.filter(
      (r) =>
        r.title.includes(keyword) ||
        r.description.includes(keyword) ||
        r.tags.some((tag) => tag.includes(keyword))
    );

    return [
      200,
      {
        code: 200,
        msg: '搜索成功',
        data: {
          list: filtered,
          total: filtered.length
        }
      }
    ];
  });

  // 获取搜索建议
  mock.onGet(/\/content\/search-suggestions/).reply((config) => {
    const keyword = config.params?.keyword || '';
    const suggestions = ['UI设计', '海报模板', 'Logo设计', '图标素材', '插画素材'].filter(
      (s) => s.includes(keyword)
    );

    return [
      200,
      {
        code: 200,
        msg: '获取成功',
        data: suggestions
      }
    ];
  });

  // 收藏资源
  mock.onPost(/\/resource\/collect/).reply(200, {
    code: 200,
    msg: '收藏成功',
    data: null
  });

  // 下载资源
  mock.onPost(/\/resource\/download/).reply(200, {
    code: 200,
    msg: '下载成功',
    data: {
      downloadUrl: '/downloads/mock-file.zip'
    }
  });

  // ========== 用户相关 ==========

  // 登录
  mock.onPost('/auth/login').reply(200, {
    code: 200,
    msg: '登录成功',
    data: {
      token: 'mock-token-' + Date.now(),
      userInfo: {
        userId: 'user-mock',
        username: 'mockuser',
        nickname: 'Mock用户',
        avatar: 'https://via.placeholder.com/100x100?text=User',
        email: 'mock@example.com',
        vipLevel: 0,
        vipExpireTime: null
      }
    }
  });

  // 注册
  mock.onPost('/auth/register').reply(200, {
    code: 200,
    msg: '注册成功',
    data: null
  });

  // 获取用户信息
  mock.onGet('/user/info').reply(200, {
    code: 200,
    msg: '获取成功',
    data: {
      userId: 'user-mock',
      username: 'mockuser',
      nickname: 'Mock用户',
      avatar: 'https://via.placeholder.com/100x100?text=User',
      email: 'mock@example.com',
      vipLevel: 0,
      vipExpireTime: null
    }
  });

  // ========== 上传相关 ==========

  // 上传文件
  mock.onPost('/upload/file').reply(200, {
    code: 200,
    msg: '上传成功',
    data: {
      fileId: 'file-' + Date.now(),
      fileUrl: '/uploads/mock-file.zip',
      fileName: 'mock-file.zip',
      fileSize: 1024000
    }
  });

  // ========== 其他未匹配的请求 ==========
  mock.onAny().passThrough();

  return mock;
}
