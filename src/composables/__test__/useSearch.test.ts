/**
 * 搜索组合式函数单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSearch } from '../useSearch';
import * as contentAPI from '@/api/content';
import type { ApiResponse } from '@/types/api';

// Mock vue-router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockCurrentRoute = {
  value: {
    path: '/home',
    fullPath: '/home'
  }
};

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    currentRoute: mockCurrentRoute
  })
}));

// Mock API calls
vi.mock('@/api/content', () => ({
  getSearchSuggestions: vi.fn()
}));

describe('useSearch', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { keyword, suggestions, showSuggestions, loadingSuggestions, searching, error } =
        useSearch();

      expect(keyword.value).toBe('');
      expect(suggestions.value).toEqual([]);
      expect(showSuggestions.value).toBe(false);
      expect(loadingSuggestions.value).toBe(false);
      expect(searching.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe('fetchSuggestions', () => {
    it('should not fetch suggestions for empty keyword', async () => {
      const { keyword } = useSearch();

      keyword.value = '';

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(contentAPI.getSearchSuggestions).not.toHaveBeenCalled();
    });

    it('should not fetch suggestions for keyword less than 2 characters', async () => {
      const { keyword } = useSearch();

      keyword.value = 'a';

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(contentAPI.getSearchSuggestions).not.toHaveBeenCalled();
    });

    it('should fetch suggestions for valid keyword', async () => {
      const { keyword, suggestions, showSuggestions } = useSearch();

      const mockResponse: ApiResponse<string[]> = {
        code: 200,
        msg: '成功',
        data: ['UI设计', 'UI图标', 'UI界面'],
        timestamp: Date.now()
      };

      vi.mocked(contentAPI.getSearchSuggestions).mockResolvedValue(mockResponse);

      keyword.value = 'UI';

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(contentAPI.getSearchSuggestions).toHaveBeenCalledWith('UI', 10);
      expect(suggestions.value).toEqual(['UI设计', 'UI图标', 'UI界面']);
      expect(showSuggestions.value).toBe(true);
    });

    it('should debounce multiple keyword changes', async () => {
      const { keyword } = useSearch();

      vi.mocked(contentAPI.getSearchSuggestions).mockResolvedValue({
        code: 200,
        msg: '成功',
        data: ['UI设计'],
        timestamp: Date.now()
      });

      // Rapid keyword changes
      keyword.value = 'U';
      await new Promise((resolve) => setTimeout(resolve, 100));
      keyword.value = 'UI';
      await new Promise((resolve) => setTimeout(resolve, 100));
      keyword.value = 'UI设';

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Should only call API once with the final keyword
      expect(contentAPI.getSearchSuggestions).toHaveBeenCalledTimes(1);
      expect(contentAPI.getSearchSuggestions).toHaveBeenCalledWith('UI设', 10);
    });

    it('should handle API error gracefully', async () => {
      const { keyword, suggestions, showSuggestions, error } = useSearch();

      vi.mocked(contentAPI.getSearchSuggestions).mockRejectedValue(new Error('Network error'));

      keyword.value = 'UI';

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(suggestions.value).toEqual([]);
      expect(showSuggestions.value).toBe(false);
      // 修复：错误消息是 "Network error" 而不是包含中文
      expect(error.value).toBe('Network error');
    });

    it('should hide suggestions when no results', async () => {
      const { keyword, suggestions, showSuggestions } = useSearch();

      const mockResponse: ApiResponse<string[]> = {
        code: 200,
        msg: '成功',
        data: [],
        timestamp: Date.now()
      };

      vi.mocked(contentAPI.getSearchSuggestions).mockResolvedValue(mockResponse);

      keyword.value = 'xyz';

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(suggestions.value).toEqual([]);
      expect(showSuggestions.value).toBe(false);
    });
  });

  describe('handleSearch', () => {
    it('should not search with empty keyword', async () => {
      const { handleSearch, keyword } = useSearch();

      keyword.value = '';

      await handleSearch();

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should search with current keyword', async () => {
      const { handleSearch, keyword } = useSearch();

      keyword.value = 'UI设计';

      await handleSearch();

      expect(mockPush).toHaveBeenCalledWith({
        path: '/search',
        query: {
          keyword: 'UI设计'
        }
      });
    });

    it('should search with provided keyword', async () => {
      const { handleSearch } = useSearch();

      await handleSearch('海报设计');

      expect(mockPush).toHaveBeenCalledWith({
        path: '/search',
        query: {
          keyword: '海报设计'
        }
      });
    });

    it('should trim keyword before searching', async () => {
      const { handleSearch, keyword } = useSearch();

      keyword.value = '  UI设计  ';

      await handleSearch();

      expect(mockPush).toHaveBeenCalledWith({
        path: '/search',
        query: {
          keyword: 'UI设计'
        }
      });
    });

    it('should hide suggestions after search', async () => {
      const { handleSearch, keyword, showSuggestions } = useSearch();

      keyword.value = 'UI设计';
      (showSuggestions as any).value = true;

      await handleSearch();

      expect(showSuggestions.value).toBe(false);
    });

    it('should update URL when already on search page', async () => {
      const { handleSearch, keyword } = useSearch();

      mockCurrentRoute.value.path = '/search';
      keyword.value = 'UI设计';

      await handleSearch();

      expect(mockReplace).toHaveBeenCalledWith({
        path: '/search',
        query: {
          keyword: 'UI设计'
        }
      });
    });

    it('should update resource store search params', async () => {
      const { handleSearch, keyword } = useSearch();
      const resourceStore = useResourceStore();

      keyword.value = 'UI设计';

      await handleSearch();

      expect(resourceStore.searchParams.keyword).toBe('UI设计');
      expect(resourceStore.searchParams.pageNum).toBe(1);
    });

    it('should set searching state during search', async () => {
      const { handleSearch, keyword, searching } = useSearch();

      keyword.value = 'UI设计';

      const searchPromise = handleSearch();

      // searching should be true during search
      expect(searching.value).toBe(true);

      await searchPromise;

      // searching should be false after search
      expect(searching.value).toBe(false);
    });
  });

  describe('selectSuggestion', () => {
    it('should update keyword and execute search', async () => {
      const { selectSuggestion, keyword, showSuggestions } = useSearch();

      // 确保当前不在搜索页
      mockCurrentRoute.value.path = '/home';
      
      // 确保mock被清除
      mockPush.mockClear();

      // 调用selectSuggestion并等待完成
      await selectSuggestion('UI设计');

      expect(keyword.value).toBe('UI设计');
      expect(showSuggestions.value).toBe(false);
      
      // 验证mockPush被调用
      expect(mockPush).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith({
        path: '/search',
        query: {
          keyword: 'UI设计'
        }
      });
    });
  });

  describe('clearSearch', () => {
    it('should clear all search state', () => {
      const { clearSearch, keyword, suggestions, showSuggestions, error } = useSearch();

      // Set some state
      keyword.value = 'UI设计';
      (suggestions as any).value = ['UI设计', 'UI图标'];
      (showSuggestions as any).value = true;
      (error as any).value = 'Some error';

      clearSearch();

      expect(keyword.value).toBe('');
      expect(suggestions.value).toEqual([]);
      expect(showSuggestions.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe('hideSuggestions', () => {
    it('should hide suggestions panel', () => {
      const { hideSuggestions, showSuggestions } = useSearch();

      (showSuggestions as any).value = true;

      hideSuggestions();

      expect(showSuggestions.value).toBe(false);
    });
  });

  describe('showSuggestionsPanel', () => {
    it('should show suggestions panel when suggestions exist', async () => {
      const { showSuggestionsPanel, keyword, showSuggestions } = useSearch();

      // 先通过正常流程获取联想结果
      const mockResponse: ApiResponse<string[]> = {
        code: 200,
        msg: '成功',
        data: ['UI设计', 'UI图标'],
        timestamp: Date.now()
      };

      vi.mocked(contentAPI.getSearchSuggestions).mockResolvedValue(mockResponse);

      keyword.value = 'UI';

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      // 然后显示面板
      showSuggestionsPanel();

      expect(showSuggestions.value).toBe(true);
    });

    it('should not show suggestions panel when no suggestions', () => {
      const { showSuggestionsPanel, showSuggestions } = useSearch();

      // 没有联想结果时
      showSuggestionsPanel();

      expect(showSuggestions.value).toBe(false);
    });
  });

  describe('resetError', () => {
    it('should reset error state', () => {
      const { resetError, error } = useSearch();

      (error as any).value = 'Test error';

      resetError();

      expect(error.value).toBeNull();
    });
  });
});

// Import stores after mocks are set up
import { useResourceStore } from '@/pinia/resourceStore';
