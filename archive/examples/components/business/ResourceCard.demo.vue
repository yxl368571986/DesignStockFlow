<!--
  ResourceCard 组件演示页面
  展示资源卡片组件的各种使用场景
-->

<script setup lang="ts">
import { ref } from 'vue';
import ResourceCard from './ResourceCard.vue';
import type { ResourceInfo } from '@/types/models';

// 模拟资源数据
const resources = ref<ResourceInfo[]>([
  {
    resourceId: '1',
    title: 'UI设计素材包 - 现代简约风格',
    description: '包含100+精美UI组件',
    cover: 'https://via.placeholder.com/400x300/165DFF/FFFFFF?text=UI+Design',
    previewImages: [],
    format: 'PSD',
    fileSize: 52428800,
    downloadCount: 1234,
    vipLevel: 0,
    categoryId: 'ui-design',
    categoryName: 'UI设计',
    tags: ['UI', '设计', '简约'],
    uploaderId: 'user1',
    uploaderName: '设计师A',
    isAudit: 1,
    createTime: '2024-01-01',
    updateTime: '2024-01-01'
  },
  {
    resourceId: '2',
    title: 'VIP专属 - 高端品牌VI设计模板',
    description: 'VIP会员专享资源',
    cover: 'https://via.placeholder.com/400x300/FF7D00/FFFFFF?text=VIP+Resource',
    previewImages: [],
    format: 'AI',
    fileSize: 104857600,
    downloadCount: 5678,
    vipLevel: 1,
    categoryId: 'brand',
    categoryName: '品牌设计',
    tags: ['VI', '品牌', 'VIP'],
    uploaderId: 'user2',
    uploaderName: '设计师B',
    isAudit: 1,
    createTime: '2024-01-02',
    updateTime: '2024-01-02'
  },
  {
    resourceId: '3',
    title: '电商海报设计素材 - 双十一活动',
    description: '电商促销海报模板',
    cover: 'https://via.placeholder.com/400x300/67C23A/FFFFFF?text=E-commerce',
    previewImages: [],
    format: 'CDR',
    fileSize: 31457280,
    downloadCount: 890,
    vipLevel: 0,
    categoryId: 'ecommerce',
    categoryName: '电商设计',
    tags: ['电商', '海报', '促销'],
    uploaderId: 'user3',
    uploaderName: '设计师C',
    isAudit: 1,
    createTime: '2024-01-03',
    updateTime: '2024-01-03'
  },
  {
    resourceId: '4',
    title: '插画素材包 - 扁平化风格',
    description: '50+扁平化插画素材',
    cover: 'https://via.placeholder.com/400x300/E6A23C/FFFFFF?text=Illustration',
    previewImages: [],
    format: 'SVG',
    fileSize: 10485760,
    downloadCount: 12345,
    vipLevel: 0,
    categoryId: 'illustration',
    categoryName: '插画',
    tags: ['插画', '扁平化', '矢量'],
    uploaderId: 'user4',
    uploaderName: '设计师D',
    isAudit: 1,
    createTime: '2024-01-04',
    updateTime: '2024-01-04'
  }
]);

// 处理卡片点击
function handleCardClick(resourceId: string) {
  console.log('点击卡片:', resourceId);
}

// 处理下载
function handleDownload(resourceId: string) {
  console.log('下载资源:', resourceId);
  alert(`开始下载资源: ${resourceId}`);
}

// 处理收藏
function handleCollect(resourceId: string) {
  console.log('收藏资源:', resourceId);
  alert(`已收藏资源: ${resourceId}`);
}
</script>

<template>
  <div class="demo-container">
    <h1>ResourceCard 组件演示</h1>

    <section class="demo-section">
      <h2>基础用法</h2>
      <p>展示资源卡片的基本信息，包括封面图、标题、格式、下载次数等</p>
      <div class="resource-grid">
        <ResourceCard
          v-for="resource in resources"
          :key="resource.resourceId"
          :resource="resource"
          @click="handleCardClick"
          @download="handleDownload"
          @collect="handleCollect"
        />
      </div>
    </section>

    <section class="demo-section">
      <h2>隐藏操作按钮</h2>
      <p>设置 showActions 为 false 可以隐藏悬停时的操作按钮</p>
      <div class="resource-grid">
        <ResourceCard
          :resource="resources[0]"
          :show-actions="false"
        />
        <ResourceCard
          :resource="resources[1]"
          :show-actions="false"
        />
      </div>
    </section>

    <section class="demo-section">
      <h2>VIP资源标识</h2>
      <p>vipLevel > 0 的资源会显示VIP标识</p>
      <div class="resource-grid">
        <ResourceCard
          :resource="resources[1]"
          @download="handleDownload"
          @collect="handleCollect"
        />
      </div>
    </section>

    <section class="demo-section">
      <h2>响应式布局</h2>
      <p>组件会根据屏幕尺寸自动调整布局（尝试调整浏览器窗口大小）</p>
      <div class="responsive-info">
        <ul>
          <li>桌面端（>1200px）：4列网格，4:3宽高比</li>
          <li>平板（769px-1200px）：3列网格，中间宽高比</li>
          <li>移动端（<768px）：2列网格，1:1宽高比</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 40px;
  text-align: center;
}

.demo-section {
  margin-bottom: 60px;
}

.demo-section h2 {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.demo-section p {
  font-size: 14px;
  color: #606266;
  margin-bottom: 24px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.responsive-info {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}

.responsive-info ul {
  margin: 0;
  padding-left: 20px;
}

.responsive-info li {
  font-size: 14px;
  color: #606266;
  line-height: 2;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .demo-container {
    padding: 20px 12px;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 30px;
  }

  .demo-section h2 {
    font-size: 20px;
  }

  .resource-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  h1,
  .demo-section h2 {
    color: #e5eaf3;
  }

  .demo-section p,
  .responsive-info li {
    color: #a8abb2;
  }

  .responsive-info {
    background: #2b2b2b;
  }
}
</style>
