/**
 * 资源状态管理 Store 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useResourceStore } from '../resourceStore';

// Mock API
vi.mock('@/api/resource', () => ({
  getResourceList: vi.fn(() =>
    Promise.resolve({
      code: 200,
      msg: 'success',
      data: {
        list: [
          {
            resourceId: '1',
            title: '测试资源1',
            description: '描述1',
            cover: 'https://example.com/cover1.jpg',
            previewImages: ['https://example.com/preview1.jpg'],
            format: 'PSD',
            fileSize: 1024000,
            downloadCount: 100,
            vipLevel: 0,
            categoryId: 'ui-design',
            categoryName: 'UI设计',
            tags: ['UI', '设计'],
            uploaderId: 'user1',
            uploaderName: '上传者1',
            isAudit: 1,
            createTime: '2024-01-01T00:00:00Z',
            updateTime: '2024-01-01T00:00:00Z'
          },
          {
            resourceId: '2',
            title: '测试资源2',
            description: '描述2',
            cover: 'https://example.com/cover2.jpg',
            previewImages: ['https://example.com/preview2.jpg'],
            format: 'AI',
            fileSize: 2048000,
            downloadCount: 200,
            vipLevel: 1,
            categoryId: 'illustration',
            categoryName: '插画',
            tags: ['插画', '设计'],
            uploaderId: 'user2',
            uploaderName: '上传者2',
            isAudit: 1,
            createTime: '2024-01-02T00:00:00Z',
            updateTime: '2024-01-02T00:00:00Z'
          }
        ],
        total: 2,
        pageNum: 1,
        pageSize: 20
      },
      timestamp: Date.now()
    })
  )
}));

describe('resourceStore', () => {
  beforeEach(() => {
    // 每个测试前创建新的Pinia实例
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with empty resources and default search params', () => {
    const store = useResourceStore();

    expect(store.resources).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.searchParams).toEqual({
      keyword: undefined,
      categoryId: undefined,
      format: undefined,
      vipLevel: undefined,
      sortType: 'comprehensive',
      pageNum: 1,
      pageSize: 20
    });
  });

  it('should fetch resources successfully', async () => {
    const store = useResourceStore();

    await store.fetchResources();

    expect(store.loading).toBe(false);
    expect(store.resources).toHaveLength(2);
    expect(store.total).toBe(2);
    expect(store.error).toBeNull();
    // 验证资源已加载，不检查具体顺序（因为会被排序）
    const titles = store.resources.map(r => r.title);
    expect(titles).toContain('测试资源1');
    expect(titles).toContain('测试资源2');
  });

  it('should update search params correctly', () => {
    const store = useResourceStore();

    store.updateSearchParams({ keyword: 'UI设计' }, false);

    expect(store.searchParams.keyword).toBe('UI设计');
    expect(store.searchParams.pageNum).toBe(1); // 应该重置页码
  });

  it('should update category and reset page number', () => {
    const store = useResourceStore();

    // 先设置页码为2
    store.updateSearchParams({ pageNum: 2 }, false);
    expect(store.searchParams.pageNum).toBe(2);

    // 更新分类应该重置页码
    store.updateSearchParams({ categoryId: 'ui-design' }, false);
    expect(store.searchParams.categoryId).toBe('ui-design');
    expect(store.searchParams.pageNum).toBe(1);
  });

  it('should reset search correctly', async () => {
    const store = useResourceStore();

    // 设置一些筛选条件
    store.updateSearchParams(
      {
        keyword: 'test',
        categoryId: 'ui-design',
        format: 'PSD',
        vipLevel: 1,
        pageNum: 3
      },
      false
    );

    // 重置搜索
    await store.resetSearch();

    expect(store.searchParams).toEqual({
      keyword: undefined,
      categoryId: undefined,
      format: undefined,
      vipLevel: undefined,
      sortType: 'comprehensive',
      pageNum: 1,
      pageSize: 20
    });
  });

  it('should check hasResources correctly', async () => {
    const store = useResourceStore();

    expect(store.hasResources).toBe(false);

    await store.fetchResources();

    expect(store.hasResources).toBe(true);
  });

  it('should calculate totalPages correctly', async () => {
    const store = useResourceStore();

    await store.fetchResources();

    // total = 2, pageSize = 20, totalPages = 1
    expect(store.totalPages).toBe(1);

    // 修改pageSize
    store.searchParams.pageSize = 1;
    expect(store.totalPages).toBe(2);
  });

  it('should check hasNextPage and hasPrevPage correctly', async () => {
    const store = useResourceStore();

    await store.fetchResources();
    store.searchParams.pageSize = 1; // 设置每页1条，总共2页

    // 第1页
    store.searchParams.pageNum = 1;
    expect(store.hasNextPage).toBe(true);
    expect(store.hasPrevPage).toBe(false);

    // 第2页
    store.searchParams.pageNum = 2;
    expect(store.hasNextPage).toBe(false);
    expect(store.hasPrevPage).toBe(true);
  });

  it('should check hasFilters correctly', () => {
    const store = useResourceStore();

    expect(store.hasFilters).toBe(false);

    store.updateSearchParams({ keyword: 'test' }, false);
    expect(store.hasFilters).toBe(true);

    store.resetSearch();
    expect(store.hasFilters).toBe(false);

    store.updateSearchParams({ categoryId: 'ui-design' }, false);
    expect(store.hasFilters).toBe(true);
  });

  it('should set keyword correctly', () => {
    const store = useResourceStore();

    store.setKeyword('UI设计');

    expect(store.searchParams.keyword).toBe('UI设计');
  });

  it('should set category correctly', () => {
    const store = useResourceStore();

    store.setCategory('ui-design');

    expect(store.searchParams.categoryId).toBe('ui-design');
  });

  it('should set format correctly', () => {
    const store = useResourceStore();

    store.setFormat('PSD');

    expect(store.searchParams.format).toBe('PSD');
  });

  it('should set vipLevel correctly', () => {
    const store = useResourceStore();

    store.setVipLevel(1);

    expect(store.searchParams.vipLevel).toBe(1);
  });

  it('should set sortType correctly', () => {
    const store = useResourceStore();

    store.setSortType('download');

    expect(store.searchParams.sortType).toBe('download');
  });

  it('should navigate pages correctly', () => {
    const store = useResourceStore();
    store.searchParams.pageSize = 1;
    store.total = 3; // 3页

    // 下一页
    store.nextPage();
    expect(store.searchParams.pageNum).toBe(2);

    store.nextPage();
    expect(store.searchParams.pageNum).toBe(3);

    // 已经是最后一页，不应该继续增加
    store.nextPage();
    expect(store.searchParams.pageNum).toBe(3);

    // 上一页
    store.prevPage();
    expect(store.searchParams.pageNum).toBe(2);

    store.prevPage();
    expect(store.searchParams.pageNum).toBe(1);

    // 已经是第一页，不应该继续减少
    store.prevPage();
    expect(store.searchParams.pageNum).toBe(1);
  });

  it('should find resource by id', async () => {
    const store = useResourceStore();

    await store.fetchResources();

    const resource = store.findResourceById('1');
    expect(resource).toBeDefined();
    expect(resource?.title).toBe('测试资源1');

    const notFound = store.findResourceById('999');
    expect(notFound).toBeUndefined();
  });

  it('should update resource correctly', async () => {
    const store = useResourceStore();

    await store.fetchResources();

    store.updateResource('1', { downloadCount: 150 });

    const resource = store.findResourceById('1');
    expect(resource?.downloadCount).toBe(150);
  });

  it('should clear cache correctly', async () => {
    const store = useResourceStore();

    await store.fetchResources();

    // 清除所有缓存
    store.clearCache();

    // 缓存应该被清空（通过再次获取数据验证）
    await store.fetchResources();
    expect(store.resources).toHaveLength(2);
  });

  it('should reset store correctly', async () => {
    const store = useResourceStore();

    await store.fetchResources();
    store.updateSearchParams({ keyword: 'test' }, false);

    store.reset();

    expect(store.resources).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.searchParams).toEqual({
      keyword: undefined,
      categoryId: undefined,
      format: undefined,
      vipLevel: undefined,
      sortType: 'comprehensive',
      pageNum: 1,
      pageSize: 20
    });
  });
});
