# BannerCarousel 轮播图组件

## 功能特性

- ✅ 自动轮播（3秒间隔）
- ✅ 指示器（圆点）
- ✅ 左右切换按钮（桌面端显示，移动端隐藏）
- ✅ 点击跳转链接（支持内部链接、外部链接、分类、资源详情）
- ✅ 响应式图片（移动端/桌面端不同高度）
- ✅ 基于Element Plus的Carousel组件
- ✅ 自动从configStore获取激活的轮播图数据
- ✅ 支持时间范围过滤（只显示有效期内的轮播图）

## 基础用法

```vue
<template>
  <BannerCarousel />
</template>

<script setup lang="ts">
import BannerCarousel from '@/components/business/BannerCarousel.vue';
</script>
```

## 自定义高度

```vue
<template>
  <!-- 桌面端500px，移动端250px -->
  <BannerCarousel height="500px" mobile-height="250px" />
</template>

<script setup lang="ts">
import BannerCarousel from '@/components/business/BannerCarousel.vue';
</script>
```

## 监听事件

```vue
<template>
  <BannerCarousel @change="handleChange" @click="handleClick" />
</template>

<script setup lang="ts">
import BannerCarousel from '@/components/business/BannerCarousel.vue';
import type { BannerInfo } from '@/types/models';

function handleChange(index: number) {
  console.log('当前轮播图索引:', index);
}

function handleClick(banner: BannerInfo) {
  console.log('点击的轮播图:', banner);
}
</script>
```

## Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| height | 轮播图高度（桌面端） | string | '400px' |
| mobileHeight | 轮播图高度（移动端） | string | '200px' |

## Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| change | 轮播图切换时触发 | (index: number) |
| click | 点击轮播图时触发 | (banner: BannerInfo) |

## 数据来源

组件自动从 `configStore.activeBanners` 获取轮播图数据。

`activeBanners` 是一个计算属性，会自动过滤：
- 状态为启用（status === 1）
- 在有效期内（当前时间在 startTime 和 endTime 之间）
- 按 sort 字段排序

## 链接类型

轮播图支持4种链接类型（`linkType`）：

1. **internal** - 内部链接（站内路由）
   - 示例：`/about`
   - 行为：使用 `router.push()` 跳转

2. **external** - 外部链接
   - 示例：`https://example.com`
   - 行为：新标签页打开（`window.open()`）

3. **category** - 分类页面
   - 示例：`ui-design`（分类ID）
   - 行为：跳转到 `/resource/list?categoryId=ui-design`

4. **resource** - 资源详情页
   - 示例：`res123`（资源ID）
   - 行为：跳转到 `/resource/res123`

## 响应式设计

### 桌面端（>1200px）
- 高度：400px（默认）
- 显示左右切换按钮（40x40px）
- 指示器：10px圆点，激活时24px宽
- 标题字体：18px

### 平板端（768px-1200px）
- 高度：400px（默认）
- 显示左右切换按钮（36x36px）
- 指示器：10px圆点，激活时24px宽
- 标题字体：16px

### 移动端（<768px）
- 高度：200px（默认）
- 隐藏左右切换按钮
- 指示器：6px圆点，激活时16px宽
- 标题字体：14px

## 样式定制

组件使用了深度选择器（`:deep()`）来覆盖Element Plus的默认样式，你可以通过以下方式进一步定制：

```vue
<style scoped>
.banner-carousel {
  /* 自定义圆角 */
  :deep(.el-carousel) {
    border-radius: 12px;
  }

  /* 自定义指示器颜色 */
  :deep(.el-carousel__indicator.is-active .el-carousel__button) {
    background-color: #ff7d00; /* 使用品牌辅助色 */
  }

  /* 自定义箭头样式 */
  :deep(.el-carousel__arrow) {
    background-color: rgba(22, 93, 255, 0.8); /* 使用品牌主色 */
  }
}
</style>
```

## 注意事项

1. **数据加载**：组件依赖 `configStore`，确保在使用前已调用 `configStore.fetchBanners()` 或 `configStore.initConfig()`

2. **空状态**：当没有激活的轮播图时，会显示空状态提示

3. **性能优化**：
   - 图片使用 `loading="lazy"` 懒加载
   - 轮播图切换使用 CSS 过渡动画
   - 响应式检测使用防抖处理

4. **安全性**：
   - 外部链接使用 `noopener,noreferrer` 防止安全风险
   - 图片URL应该经过后端验证

5. **可访问性**：
   - 图片包含 `alt` 属性
   - 支持键盘导航（Element Plus内置）

## 完整示例

```vue
<template>
  <div class="home-page">
    <!-- 轮播图区域 -->
    <section class="banner-section">
      <BannerCarousel
        height="500px"
        mobile-height="250px"
        @change="handleBannerChange"
        @click="handleBannerClick"
      />
    </section>

    <!-- 其他内容 -->
    <section class="content-section">
      <!-- ... -->
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import BannerCarousel from '@/components/business/BannerCarousel.vue';
import { useConfigStore } from '@/pinia/configStore';
import type { BannerInfo } from '@/types/models';

const configStore = useConfigStore();

// 页面加载时获取轮播图数据
onMounted(async () => {
  await configStore.fetchBanners();
});

function handleBannerChange(index: number) {
  console.log('切换到第', index + 1, '张轮播图');
}

function handleBannerClick(banner: BannerInfo) {
  console.log('点击轮播图:', banner.title);
  // 可以在这里添加埋点统计
}
</script>

<style scoped>
.home-page {
  .banner-section {
    margin-bottom: 32px;
  }

  .content-section {
    padding: 0 16px;
  }
}
</style>
```

## 与需求的对应关系

- **需求16.1-16.8**：轮播图展示
  - ✅ 调用轮播图接口获取配置数据
  - ✅ 按sort字段排序展示
  - ✅ 仅展示当前时间在有效期内的轮播图
  - ✅ 不展示status为0的轮播图
  - ✅ 根据linkType跳转到对应页面
  - ✅ 每3秒自动切换
  - ✅ 鼠标悬浮暂停自动播放（Element Plus内置）
  - ✅ 轮播图数据为空时显示默认占位

- **需求9.2**：轮播图管理
  - ✅ 自动轮播
  - ✅ 指示器
  - ✅ 左右切换按钮
  - ✅ 点击跳转链接
  - ✅ 响应式图片
