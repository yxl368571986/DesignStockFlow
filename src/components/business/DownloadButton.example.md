# DownloadButton 下载按钮组件

下载按钮组件，用于触发资源下载，支持权限检查、VIP验证和下载状态显示。

## 功能特性

- ✅ 根据VIP等级显示不同样式（VIP资源显示橙色渐变按钮）
- ✅ 点击触发下载（自动调用useDownload处理权限检查）
- ✅ 显示下载中状态（loading动画）
- ✅ 未登录自动显示确认对话框
- ✅ 非VIP用户下载VIP资源显示升级提示
- ✅ 支持多种按钮样式（圆形、圆角、朴素等）
- ✅ 响应式设计，移动端适配

## 基础用法

### 普通下载按钮

```vue
<template>
  <DownloadButton
    resource-id="res_123456"
    text="下载资源"
  />
</template>

<script setup lang="ts">
import DownloadButton from '@/components/business/DownloadButton.vue';
</script>
```

### VIP资源下载按钮

```vue
<template>
  <DownloadButton
    resource-id="res_vip_001"
    :vip-level="1"
    text="VIP下载"
  />
</template>

<script setup lang="ts">
import DownloadButton from '@/components/business/DownloadButton.vue';
</script>
```

### 圆形图标按钮

```vue
<template>
  <DownloadButton
    resource-id="res_123456"
    circle
  />
</template>

<script setup lang="ts">
import DownloadButton from '@/components/business/DownloadButton.vue';
</script>
```

### 圆角按钮

```vue
<template>
  <DownloadButton
    resource-id="res_123456"
    text="立即下载"
    round
  />
</template>

<script setup lang="ts">
import DownloadButton from '@/components/business/DownloadButton.vue';
</script>
```

### 朴素按钮

```vue
<template>
  <DownloadButton
    resource-id="res_123456"
    text="下载"
    plain
  />
</template>

<script setup lang="ts">
import DownloadButton from '@/components/business/DownloadButton.vue';
</script>
```

### 不同尺寸

```vue
<template>
  <div class="button-group">
    <DownloadButton
      resource-id="res_123456"
      text="大按钮"
      size="large"
    />
    
    <DownloadButton
      resource-id="res_123456"
      text="默认按钮"
      size="default"
    />
    
    <DownloadButton
      resource-id="res_123456"
      text="小按钮"
      size="small"
    />
  </div>
</template>

<script setup lang="ts">
import DownloadButton from '@/components/business/DownloadButton.vue';
</script>

<style scoped>
.button-group {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
```

### 监听事件

```vue
<template>
  <DownloadButton
    resource-id="res_123456"
    text="下载资源"
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import DownloadButton from '@/components/business/DownloadButton.vue';

function handleSuccess(resourceId: string) {
  console.log('下载成功:', resourceId);
  ElMessage.success('资源下载成功！');
}

function handleError(error: string) {
  console.error('下载失败:', error);
  ElMessage.error(`下载失败: ${error}`);
}
</script>
```

## Props

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| resourceId | 资源ID（必填） | string | - | - |
| vipLevel | 资源所需的VIP等级 | number | 0/1 | 0 |
| type | 按钮类型 | string | primary/success/warning/danger/info/default | primary |
| size | 按钮大小 | string | large/default/small | default |
| circle | 是否为圆形按钮 | boolean | - | false |
| round | 是否为圆角按钮 | boolean | - | false |
| plain | 是否为朴素按钮 | boolean | - | false |
| text | 按钮文本 | string | - | '' |
| disabled | 是否禁用 | boolean | - | false |

## Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| success | 下载成功时触发 | (resourceId: string) |
| error | 下载失败时触发 | (error: string) |

## 样式说明

### VIP按钮样式

VIP资源（vipLevel > 0）的下载按钮会自动应用橙色渐变样式：

- 背景：橙色到金色渐变（#ff7d00 → #ffb800）
- 悬停：更亮的渐变效果
- 激活：更深的渐变效果

### 下载中状态

下载中时按钮会显示loading动画，并禁用点击。

### 响应式设计

- 移动端：字体大小自动调整
- 暗色模式：自动适配暗色主题

## 权限处理流程

1. **未登录用户**：点击按钮 → 弹出确认对话框 → 用户确认 → 跳转登录页
2. **非VIP用户下载VIP资源**：点击按钮 → 弹出VIP升级提示 → 用户确认 → 跳转VIP页面
3. **有权限用户**：点击按钮 → 直接下载 → 显示下载成功提示

## 使用场景

### 资源列表页

```vue
<template>
  <div class="resource-list">
    <div v-for="resource in resources" :key="resource.resourceId" class="resource-item">
      <h3>{{ resource.title }}</h3>
      <DownloadButton
        :resource-id="resource.resourceId"
        :vip-level="resource.vipLevel"
        text="下载"
        round
      />
    </div>
  </div>
</template>
```

### 资源详情页

```vue
<template>
  <div class="resource-detail">
    <div class="detail-header">
      <h1>{{ resource.title }}</h1>
      <DownloadButton
        :resource-id="resource.resourceId"
        :vip-level="resource.vipLevel"
        text="立即下载"
        size="large"
        round
      />
    </div>
  </div>
</template>
```

### 资源卡片悬浮按钮

```vue
<template>
  <div class="resource-card">
    <img :src="resource.cover" />
    <div class="card-actions">
      <DownloadButton
        :resource-id="resource.resourceId"
        :vip-level="resource.vipLevel"
        circle
      />
    </div>
  </div>
</template>
```

## 注意事项

1. **resourceId必填**：必须传入有效的资源ID
2. **权限自动处理**：组件内部自动处理登录和VIP权限检查
3. **下载状态管理**：下载中时按钮自动禁用，防止重复点击
4. **错误处理**：下载失败时会自动显示错误提示
5. **路由依赖**：组件依赖Vue Router进行页面跳转

## 相关组件

- [ResourceCard](./ResourceCard.example.md) - 资源卡片组件
- [useDownload](../../composables/useDownload.ts) - 下载逻辑组合式函数

## 需求映射

- 需求4.1：未登录用户点击下载按钮显示确认对话框
- 需求4.2：已登录的普通用户点击下载按钮验证下载次数限制
- 需求4.3：已登录的VIP用户点击下载按钮直接触发下载
- 需求4.4：非VIP用户点击VIP专属资源下载按钮弹出VIP开通弹窗
