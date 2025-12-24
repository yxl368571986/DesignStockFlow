/**
 * 收藏功能API测试
 * 测试任务7：收藏功能测试
 * 需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 44.1
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock request模块
vi.mock('@/utils/request', () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

import { get, post, del } from '@/utils/request';
import { 
  collectResource, 
  uncollectResource, 
  checkFavoriteStatus,
  checkFavoritesBatch 
} from '@/api/resource';
import { getCollections } from '@/api/personal';

const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);
const mockDel = vi.mocked(del);

describe('收藏功能API测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 禁用Mock模式以测试真实API调用
    vi.stubEnv('VITE_ENABLE_MOCK', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('7.1 添加收藏 - POST /api/v1/favorites/:resourceId', () => {
    it('应该成功添加收藏', async () => {
      const resourceId = 'test-resource-001';
      mockPost.mockResolvedValueOnce({
        code: 200,
        msg: '收藏成功',
        data: { resourceId, favoriteId: 'fav-001' },
        timestamp: Date.now()
      });

      const result = await collectResource(resourceId);

      expect(mockPost).toHaveBeenCalledWith(`/favorites/${resourceId}`);
      expect(result.code).toBe(200);
      expect(result.msg).toBe('收藏成功');
    });

    it('应该处理重复收藏的情况', async () => {
      const resourceId = 'test-resource-001';
      mockPost.mockRejectedValueOnce({
        code: 400,
        msg: '已经收藏过该资源',
        data: null
      });

      await expect(collectResource(resourceId)).rejects.toMatchObject({
        code: 400,
        msg: '已经收藏过该资源'
      });
    });

    it('应该处理资源不存在的情况', async () => {
      const resourceId = 'non-existent-resource';
      mockPost.mockRejectedValueOnce({
        code: 404,
        msg: '资源不存在',
        data: null
      });

      await expect(collectResource(resourceId)).rejects.toMatchObject({
        code: 404,
        msg: '资源不存在'
      });
    });

    it('未登录时应该返回401错误', async () => {
      const resourceId = 'test-resource-001';
      mockPost.mockRejectedValueOnce({
        code: 401,
        msg: '请先登录',
        data: null
      });

      await expect(collectResource(resourceId)).rejects.toMatchObject({
        code: 401,
        msg: '请先登录'
      });
    });
  });

  describe('7.2 取消收藏 - DELETE /api/v1/favorites/:resourceId', () => {
    it('应该成功取消收藏', async () => {
      const resourceId = 'test-resource-001';
      mockDel.mockResolvedValueOnce({
        code: 200,
        msg: '取消收藏成功',
        data: null,
        timestamp: Date.now()
      });

      const result = await uncollectResource(resourceId);

      expect(mockDel).toHaveBeenCalledWith(`/favorites/${resourceId}`);
      expect(result.code).toBe(200);
      expect(result.msg).toBe('取消收藏成功');
    });

    it('应该处理未收藏资源的取消操作', async () => {
      const resourceId = 'test-resource-001';
      mockDel.mockRejectedValueOnce({
        code: 400,
        msg: '未收藏该资源',
        data: null
      });

      await expect(uncollectResource(resourceId)).rejects.toMatchObject({
        code: 400,
        msg: '未收藏该资源'
      });
    });

    it('未登录时应该返回401错误', async () => {
      const resourceId = 'test-resource-001';
      mockDel.mockRejectedValueOnce({
        code: 401,
        msg: '请先登录',
        data: null
      });

      await expect(uncollectResource(resourceId)).rejects.toMatchObject({
        code: 401,
        msg: '请先登录'
      });
    });
  });

  describe('7.3 收藏列表 - GET /api/v1/favorites', () => {
    it('应该成功获取收藏列表', async () => {
      const mockFavorites = {
        list: [
          {
            favoriteId: 'fav-001',
            resourceId: 'res-001',
            title: '测试资源1',
            cover: 'https://example.com/cover1.jpg',
            format: 'PSD',
            fileSize: 1024000,
            downloadCount: 100,
            favoriteAt: '2025-12-24T00:00:00.000Z'
          },
          {
            favoriteId: 'fav-002',
            resourceId: 'res-002',
            title: '测试资源2',
            cover: 'https://example.com/cover2.jpg',
            format: 'AI',
            fileSize: 2048000,
            downloadCount: 200,
            favoriteAt: '2025-12-23T00:00:00.000Z'
          }
        ],
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1
      };

      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: '获取收藏列表成功',
        data: mockFavorites,
        timestamp: Date.now()
      });

      const result = await getCollections({ pageNum: 1, pageSize: 20 });

      expect(mockGet).toHaveBeenCalledWith('/favorites', { pageNum: 1, pageSize: 20 });
      expect(result.code).toBe(200);
      expect(result.data.list).toHaveLength(2);
      expect(result.data.total).toBe(2);
    });

    it('应该支持分页参数', async () => {
      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: '获取收藏列表成功',
        data: { list: [], total: 50, page: 2, pageSize: 10, totalPages: 5 },
        timestamp: Date.now()
      });

      await getCollections({ pageNum: 2, pageSize: 10 });

      expect(mockGet).toHaveBeenCalledWith('/favorites', { pageNum: 2, pageSize: 10 });
    });

    it('空收藏列表应该返回空数组', async () => {
      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: '获取收藏列表成功',
        data: { list: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
        timestamp: Date.now()
      });

      const result = await getCollections({ pageNum: 1, pageSize: 20 });

      expect(result.data.list).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it('未登录时应该返回401错误', async () => {
      mockGet.mockRejectedValueOnce({
        code: 401,
        msg: '请先登录',
        data: null
      });

      await expect(getCollections({ pageNum: 1, pageSize: 20 })).rejects.toMatchObject({
        code: 401,
        msg: '请先登录'
      });
    });
  });

  describe('7.5 收藏状态检查 - GET /api/v1/favorites/:resourceId/check', () => {
    it('已收藏资源应该返回true', async () => {
      const resourceId = 'test-resource-001';
      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: 'success',
        data: { isFavorited: true },
        timestamp: Date.now()
      });

      const result = await checkFavoriteStatus(resourceId);

      expect(mockGet).toHaveBeenCalledWith(`/favorites/${resourceId}/check`);
      expect(result.data.isFavorited).toBe(true);
    });

    it('未收藏资源应该返回false', async () => {
      const resourceId = 'test-resource-002';
      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: 'success',
        data: { isFavorited: false },
        timestamp: Date.now()
      });

      const result = await checkFavoriteStatus(resourceId);

      expect(result.data.isFavorited).toBe(false);
    });

    it('未登录时应该返回false（不报错）', async () => {
      const resourceId = 'test-resource-001';
      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: 'success',
        data: { isFavorited: false },
        timestamp: Date.now()
      });

      const result = await checkFavoriteStatus(resourceId);

      expect(result.data.isFavorited).toBe(false);
    });
  });

  describe('批量检查收藏状态 - POST /api/v1/favorites/check-batch', () => {
    it('应该正确返回多个资源的收藏状态', async () => {
      const resourceIds = ['res-001', 'res-002', 'res-003'];
      mockPost.mockResolvedValueOnce({
        code: 200,
        msg: 'success',
        data: {
          'res-001': true,
          'res-002': false,
          'res-003': true
        },
        timestamp: Date.now()
      });

      const result = await checkFavoritesBatch(resourceIds);

      expect(mockPost).toHaveBeenCalledWith('/favorites/check-batch', { resourceIds });
      expect(result.data['res-001']).toBe(true);
      expect(result.data['res-002']).toBe(false);
      expect(result.data['res-003']).toBe(true);
    });

    it('空数组应该返回空对象', async () => {
      mockPost.mockResolvedValueOnce({
        code: 200,
        msg: 'success',
        data: {},
        timestamp: Date.now()
      });

      const result = await checkFavoritesBatch([]);

      expect(result.data).toEqual({});
    });

    it('未登录时应该返回全部false', async () => {
      const resourceIds = ['res-001', 'res-002'];
      mockPost.mockResolvedValueOnce({
        code: 200,
        msg: 'success',
        data: {
          'res-001': false,
          'res-002': false
        },
        timestamp: Date.now()
      });

      const result = await checkFavoritesBatch(resourceIds);

      expect(result.data['res-001']).toBe(false);
      expect(result.data['res-002']).toBe(false);
    });
  });
});
