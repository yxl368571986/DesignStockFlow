<!--
  SearchBar 组件演示
-->

<script setup lang="ts">
import { ref } from 'vue';
import SearchBar from './SearchBar.vue';
import { ElMessage } from 'element-plus';

const searchResult = ref<string>('');

function handleSearch(keyword: string) {
  searchResult.value = `搜索关键词: ${keyword}`;
  ElMessage.success(`开始搜索: ${keyword}`);
}

function handleClear() {
  searchResult.value = '';
  ElMessage.info('已清空搜索');
}
</script>

<template>
  <div class="demo-container">
    <h2>SearchBar 搜索框组件演示</h2>

    <!-- 基础用法 -->
    <section class="demo-section">
      <h3>基础用法</h3>
      <SearchBar
        @search="handleSearch"
        @clear="handleClear"
      />
      <p
        v-if="searchResult"
        class="result"
      >
        {{ searchResult }}
      </p>
    </section>

    <!-- 自定义占位符 -->
    <section class="demo-section">
      <h3>自定义占位符</h3>
      <SearchBar
        placeholder="输入关键词搜索..."
        @search="handleSearch"
      />
    </section>

    <!-- 隐藏搜索按钮 -->
    <section class="demo-section">
      <h3>隐藏搜索按钮</h3>
      <SearchBar
        :show-button="false"
        @search="handleSearch"
      />
    </section>

    <!-- 自动聚焦 -->
    <section class="demo-section">
      <h3>自动聚焦</h3>
      <SearchBar
        autofocus
        @search="handleSearch"
      />
    </section>

    <!-- 限制历史记录 -->
    <section class="demo-section">
      <h3>限制历史记录数量（最多5条）</h3>
      <SearchBar
        :max-history="5"
        @search="handleSearch"
      />
    </section>

    <!-- 功能说明 -->
    <section class="demo-section">
      <h3>功能说明</h3>
      <ul class="feature-list">
        <li>✅ 输入关键词自动显示搜索联想（防抖300ms）</li>
        <li>✅ 自动保存搜索历史到localStorage</li>
        <li>✅ 显示热门搜索词</li>
        <li>✅ 支持清空按钮</li>
        <li>✅ 支持回车键搜索</li>
        <li>✅ 点击外部区域自动关闭下拉面板</li>
        <li>✅ 响应式设计，适配移动端</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.demo-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 32px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.demo-section {
  margin-bottom: 40px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.demo-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.result {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #303133;
}

.feature-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.feature-list li {
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .demo-container {
    padding: 16px;
  }

  h2 {
    font-size: 20px;
    margin-bottom: 24px;
  }

  .demo-section {
    padding: 16px;
    margin-bottom: 24px;
  }

  .demo-section h3 {
    font-size: 15px;
  }

  .feature-list li {
    font-size: 13px;
  }
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .demo-container {
    background: #141414;
  }

  h2 {
    color: #e5eaf3;
  }

  .demo-section {
    background: #1d1e1f;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .demo-section h3 {
    color: #a8abb2;
  }

  .result {
    background: #2b2b2b;
    color: #e5eaf3;
  }

  .feature-list li {
    color: #a8abb2;
  }
}
</style>
