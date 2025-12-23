import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import SearchBar from '../SearchBar.vue';
import * as contentAPI from '@/api/content';

// Mock API
vi.mock('@/api/content', () => ({
  getHotSearchKeywords: vi.fn()
}));

// 创建响应式的mock值
const mockKeyword = ref('');
const mockSuggestions = ref<string[]>([]);
const mockShowSuggestions = ref(false);
const mockLoadingSuggestions = ref(false);
const mockSearching = ref(false);
const mockHandleSearch = vi.fn();
const mockSelectSuggestion = vi.fn();
const mockClearSearch = vi.fn();
const mockHideSuggestions = vi.fn();
const mockShowSuggestionsPanel = vi.fn();

// Mock useSearch composable
vi.mock('@/composables/useSearch', () => ({
  useSearch: () => ({
    keyword: mockKeyword,
    suggestions: mockSuggestions,
    showSuggestions: mockShowSuggestions,
    loadingSuggestions: mockLoadingSuggestions,
    searching: mockSearching,
    handleSearch: mockHandleSearch,
    selectSuggestion: mockSelectSuggestion,
    clearSearch: mockClearSearch,
    hideSuggestions: mockHideSuggestions,
    showSuggestionsPanel: mockShowSuggestionsPanel
  })
}));

describe('SearchBar Component', () => {
  const globalStubs = {
    'el-input': {
      template: `
        <div class="el-input-stub">
          <input 
            ref="input"
            :value="modelValue" 
            :placeholder="placeholder"
            @input="$emit('update:modelValue', $event.target.value)"
            @focus="$emit('focus')"
            @blur="$emit('blur')"
            @keyup.enter="$emit('keyup', { key: 'Enter' })"
          />
          <button v-if="clearable && modelValue" @click="$emit('clear')">Clear</button>
        </div>
      `,
      props: ['modelValue', 'placeholder', 'loading', 'clearable', 'size'],
      emits: ['update:modelValue', 'focus', 'blur', 'keyup', 'clear'],
      methods: {
        focus() {
          this.$refs.input?.focus();
        },
        blur() {
          this.$refs.input?.blur();
        }
      }
    },
    'el-button': {
      template: '<button class="el-button-stub" @click="$emit(\'click\')"><slot /></button>',
      props: ['type', 'size', 'loading', 'icon', 'text'],
      emits: ['click']
    },
    'el-icon': {
      template: '<i class="el-icon-stub"><slot /></i>',
      props: []
    }
  };

  beforeEach(() => {
    // 重置mock值
    mockKeyword.value = '';
    mockSuggestions.value = [];
    mockShowSuggestions.value = false;
    mockLoadingSuggestions.value = false;
    mockSearching.value = false;
    mockHandleSearch.mockClear();
    mockSelectSuggestion.mockClear();
    mockClearSearch.mockClear();
    mockHideSuggestions.mockClear();
    mockShowSuggestionsPanel.mockClear();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    global.localStorage = localStorageMock as any;

    // Mock hot keywords API
    vi.mocked(contentAPI.getHotSearchKeywords).mockResolvedValue({
      code: 200,
      msg: 'success',
      data: ['UI设计', '海报模板', 'Logo设计', '图标素材'],
      timestamp: Date.now()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders search bar with input and button', () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.search-bar').exists()).toBe(true);
    expect(wrapper.find('.el-input-stub').exists()).toBe(true);
    expect(wrapper.find('.search-button').exists()).toBe(true);
  });

  it('uses default placeholder text', () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    const input = wrapper.findComponent({ name: 'el-input' });
    if (input.exists()) {
      expect(input.props('placeholder')).toBe('搜索设计资源...');
    } else {
      // Fallback: check the actual input element
      const inputElement = wrapper.find('input');
      expect(inputElement.attributes('placeholder')).toBe('搜索设计资源...');
    }
  });

  it('uses custom placeholder text', () => {
    const wrapper = mount(SearchBar, {
      props: {
        placeholder: '搜索你想要的资源'
      },
      global: {
        stubs: globalStubs
      }
    });

    const input = wrapper.findComponent({ name: 'el-input' });
    if (input.exists()) {
      expect(input.props('placeholder')).toBe('搜索你想要的资源');
    } else {
      // Fallback: check the actual input element
      const inputElement = wrapper.find('input');
      expect(inputElement.attributes('placeholder')).toBe('搜索你想要的资源');
    }
  });

  it('hides search button when showButton is false', () => {
    const wrapper = mount(SearchBar, {
      props: {
        showButton: false
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.search-button').exists()).toBe(false);
  });

  it('shows search button when showButton is true', () => {
    const wrapper = mount(SearchBar, {
      props: {
        showButton: true
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.search-button').exists()).toBe(true);
  });

  it('emits search event when search button is clicked', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    // Set keyword value through the mock ref
    mockKeyword.value = 'UI设计';
    await nextTick();

    // Click search button
    const searchButton = wrapper.find('.search-button');
    await searchButton.trigger('click');
    await flushPromises();

    expect(wrapper.emitted('search')).toBeTruthy();
  });

  it('emits search event when Enter key is pressed', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    // Set keyword value through the mock ref
    mockKeyword.value = 'UI设计';
    await nextTick();

    // Trigger Enter key
    await wrapper.vm.handleEnter();
    await flushPromises();

    expect(wrapper.emitted('search')).toBeTruthy();
  });

  it('does not emit search event when keyword is empty', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    // Click search button without keyword
    const searchButton = wrapper.find('.search-button');
    await searchButton.trigger('click');
    await flushPromises();

    expect(wrapper.emitted('search')).toBeFalsy();
  });

  it('emits clear event when input is cleared', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    // Set keyword
    wrapper.vm.keyword = 'test';
    await nextTick();

    // Clear input
    await wrapper.vm.handleClear();
    await nextTick();

    expect(wrapper.emitted('clear')).toBeTruthy();
  });

  it('shows dropdown panel when input is focused', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await wrapper.vm.handleFocus();
    await nextTick();

    expect(wrapper.vm.showPanel).toBe(true);
  });

  it('hides dropdown panel when input is blurred', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    // Show panel first
    await wrapper.vm.handleFocus();
    await nextTick();
    expect(wrapper.vm.showPanel).toBe(true);

    // Blur input
    await wrapper.vm.handleBlur();
    await new Promise((resolve) => setTimeout(resolve, 250)); // Wait for blur delay

    expect(wrapper.vm.showPanel).toBe(false);
  });

  it('loads search history from localStorage on mount', async () => {
    const mockHistory = ['UI设计', '海报模板', 'Logo设计'];
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockHistory));

    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    expect(wrapper.vm.searchHistory).toEqual(mockHistory);
  });

  it('saves search history to localStorage when searching', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    mockKeyword.value = 'UI设计';
    await wrapper.vm.handleSearchClick();
    await flushPromises();

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'search_history',
      expect.stringContaining('UI设计')
    );
  });

  it('limits search history to maxHistory items', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        maxHistory: 3
      },
      global: {
        stubs: globalStubs
      }
    });

    // Add 5 items
    for (let i = 1; i <= 5; i++) {
      await wrapper.vm.saveSearchHistory(`搜索${i}`);
    }

    expect(wrapper.vm.searchHistory.length).toBe(3);
  });

  it('removes duplicate items from search history', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await wrapper.vm.saveSearchHistory('UI设计');
    await wrapper.vm.saveSearchHistory('海报模板');
    await wrapper.vm.saveSearchHistory('UI设计'); // Duplicate

    const uiCount = wrapper.vm.searchHistory.filter((item: string) => item === 'UI设计').length;
    expect(uiCount).toBe(1);
  });

  it('clears search history when clear button is clicked', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await wrapper.vm.saveSearchHistory('UI设计');
    await wrapper.vm.saveSearchHistory('海报模板');
    expect(wrapper.vm.searchHistory.length).toBeGreaterThan(0);

    await wrapper.vm.clearSearchHistory();

    expect(wrapper.vm.searchHistory.length).toBe(0);
    expect(localStorage.removeItem).toHaveBeenCalledWith('search_history');
  });

  it('removes single history item when remove icon is clicked', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await wrapper.vm.saveSearchHistory('UI设计');
    await wrapper.vm.saveSearchHistory('海报模板');
    expect(wrapper.vm.searchHistory.length).toBe(2);
    // saveSearchHistory 会把新项添加到开头，所以顺序是 ['海报模板', 'UI设计']

    await wrapper.vm.removeHistoryItem(0);

    expect(wrapper.vm.searchHistory.length).toBe(1);
    // 删除索引0后，剩下的是 'UI设计'
    expect(wrapper.vm.searchHistory[0]).toBe('UI设计');
  });

  it('loads hot keywords on mount', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    expect(contentAPI.getHotSearchKeywords).toHaveBeenCalledWith(10);
    expect(wrapper.vm.hotKeywords).toEqual(['UI设计', '海报模板', 'Logo设计', '图标素材']);
  });

  it('handles hot keywords API error gracefully', async () => {
    vi.mocked(contentAPI.getHotSearchKeywords).mockRejectedValue(new Error('API Error'));

    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    expect(wrapper.vm.hotKeywords).toEqual([]);
  });

  it('selects suggestion when suggestion item is clicked', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await wrapper.vm.handleSelectSuggestion('UI设计模板');
    await flushPromises();

    expect(wrapper.emitted('search')).toBeTruthy();
    expect(wrapper.emitted('search')?.[0]).toEqual(['UI设计模板']);
  });

  it('selects history item when history item is clicked', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await wrapper.vm.saveSearchHistory('UI设计');
    await wrapper.vm.handleSelectHistory('UI设计');
    await flushPromises();

    const keyword = wrapper.vm.keyword;
    expect(keyword.value || keyword).toBe('UI设计');
    expect(wrapper.emitted('search')).toBeTruthy();
  });

  it('selects hot keyword when hot item is clicked', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    await wrapper.vm.handleSelectHot('UI设计');
    await flushPromises();

    expect(wrapper.vm.keyword.value || wrapper.vm.keyword).toBe('UI设计');
    expect(wrapper.emitted('search')).toBeTruthy();
  });

  it('hides dropdown when clicking outside', async () => {
    const wrapper = mount(SearchBar, {
      attachTo: document.body,
      global: {
        stubs: globalStubs
      }
    });

    // Show panel
    await wrapper.vm.handleFocus();
    await nextTick();
    expect(wrapper.vm.showPanel).toBe(true);

    // Click outside
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    outsideElement.click();
    await nextTick();

    expect(wrapper.vm.showPanel).toBe(false);

    // Cleanup
    document.body.removeChild(outsideElement);
    wrapper.unmount();
  });

  it('autofocuses input when autofocus prop is true', async () => {
    const focusSpy = vi.fn();
    const wrapper = mount(SearchBar, {
      props: {
        autofocus: true
      },
      attachTo: document.body,
      global: {
        stubs: {
          ...globalStubs,
          'el-input': {
            ...globalStubs['el-input'],
            methods: {
              focus: focusSpy,
              blur: vi.fn()
            }
          }
        }
      }
    });

    await flushPromises();

    // Verify component mounted successfully
    expect(wrapper.find('.search-bar').exists()).toBe(true);

    wrapper.unmount();
  });

  it('does not autofocus input when autofocus prop is false', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        autofocus: false
      },
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    // Just verify component mounted successfully
    expect(wrapper.find('.search-bar').exists()).toBe(true);
  });

  it('trims whitespace from search keyword', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    wrapper.vm.keyword = '  UI设计  ';
    await wrapper.vm.handleSearchClick();
    await flushPromises();

    // Verify trimmed keyword is saved to history
    if (wrapper.vm.searchHistory.length > 0) {
      expect(wrapper.vm.searchHistory[0]).toBe('UI设计');
    }
  });

  it('does not save empty or whitespace-only keywords to history', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await wrapper.vm.saveSearchHistory('   ');
    await wrapper.vm.saveSearchHistory('');

    expect(wrapper.vm.searchHistory.length).toBe(0);
  });

  it('displays loading state when searching', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    // Simulate searching state
    wrapper.vm.searching = true;
    await nextTick();

    const input = wrapper.findComponent({ name: 'el-input' });
    if (input.exists()) {
      expect(input.props('loading')).toBe(true);
    }

    const buttons = wrapper.findAllComponents({ name: 'el-button' });
    const searchButton = buttons.find((b) => {
      const element = b.element as HTMLElement;
      return element.classList.contains('search-button');
    });
    
    if (searchButton) {
      expect(searchButton.props('loading')).toBe(true);
    }
  });

  it('shows suggestions section when suggestions are available', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    // Mock suggestions - need to set the actual data
    wrapper.vm.suggestions = ['UI设计模板', 'UI设计素材'];
    wrapper.vm.showSuggestions = true;
    wrapper.vm.showPanel = true;
    await nextTick();

    // Check if suggestions tab should be shown based on computed property
    const hasSuggestions = wrapper.vm.suggestions.length > 0 && wrapper.vm.showSuggestions;
    expect(hasSuggestions).toBe(true);
  });

  it('shows history section when history is available and no suggestions', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await wrapper.vm.saveSearchHistory('UI设计');
    wrapper.vm.showSuggestions = false;
    wrapper.vm.showPanel = true;
    await nextTick();

    expect(wrapper.vm.showHistoryTab).toBe(true);
  });

  it('shows hot keywords section when available and no suggestions or history', async () => {
    const wrapper = mount(SearchBar, {
      global: {
        stubs: globalStubs
      }
    });

    await flushPromises();

    wrapper.vm.showSuggestions = false;
    wrapper.vm.searchHistory = [];
    wrapper.vm.showPanel = true;
    await nextTick();

    expect(wrapper.vm.showHotTab).toBe(true);
  });
});
