# 管理后台UI设计文档

## 概述

本管理后台采用现代化的UI设计，提供了丰富的组件和样式，满足各种管理场景的需求。

## 设计理念

### 1. 整体设计风格 (需求21 A部分)

- **现代化扁平设计**: 简洁、清晰的界面风格
- **渐变色和毛玻璃效果**: 增强视觉层次感
- **专业配色方案**: 
  - 主色: #165DFF (蓝色)
  - 辅色: #FF7D00 (橙色)
- **微动画**: 提升交互体验
- **卡片式布局**: 清晰的内容组织
- **暗黑模式**: 支持明亮/暗黑主题切换

### 2. 核心组件

#### AdminChart - 图表组件 (需求21 C部分)

**功能特性:**
- 基于ECharts图表库
- 支持折线图、柱状图、饼图、仪表盘、雷达图
- 渐变色填充
- 鼠标悬浮显示详细数据
- 支持图表导出为图片
- 响应式自适应

**使用示例:**

```vue
<template>
  <AdminChart
    title="用户增长趋势"
    :option="chartOption"
    height="400px"
    :exportable="true"
    :refreshable="true"
    @refresh="handleRefresh"
  />
</template>

<script setup>
import AdminChart from '@/components/common/AdminChart.vue';
import { createLineChartOption } from '@/utils/chartOptions';

const chartOption = createLineChartOption({
  xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [{
    name: '新增用户',
    data: [820, 932, 901, 934, 1290, 1330],
    areaStyle: true
  }]
});

const handleRefresh = () => {
  // 重新加载数据
};
</script>
```

**预设图表配置:**

```javascript
// 折线图
import { createLineChartOption } from '@/utils/chartOptions';

// 柱状图
import { createBarChartOption } from '@/utils/chartOptions';

// 饼图
import { createPieChartOption } from '@/utils/chartOptions';

// 仪表盘
import { createGaugeChartOption } from '@/utils/chartOptions';

// 雷达图
import { createRadarChartOption } from '@/utils/chartOptions';
```

#### AdminTable - 表格组件 (需求21 D部分)

**功能特性:**
- 基于Element Plus Table
- 支持排序、筛选、分页
- 斑马纹增强可读性
- 鼠标悬浮行高亮
- 支持多选和批量操作
- 不同颜色标识状态
- 支持列宽拖拽调整
- 支持固定列和固定表头

**使用示例:**

```vue
<template>
  <AdminTable
    title="用户列表"
    :data="tableData"
    :loading="loading"
    :total="total"
    :selectable="true"
    :show-index="true"
    @refresh="loadData"
    @selection-change="handleSelectionChange"
  >
    <el-table-column prop="name" label="姓名" sortable />
    <el-table-column prop="email" label="邮箱" />
    <el-table-column prop="status" label="状态">
      <template #default="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '正常' : '禁用' }}
        </el-tag>
      </template>
    </el-table-column>

    <template #actions="{ row }">
      <el-button type="primary" size="small">编辑</el-button>
      <el-button type="danger" size="small">删除</el-button>
    </template>

    <template #batch-actions="{ selection }">
      <el-button type="danger">批量删除</el-button>
    </template>
  </AdminTable>
</template>
```

### 3. 样式类

#### 卡片样式

```html
<!-- 基础卡片 -->
<div class="admin-card">
  <div class="admin-card-header">
    <h3 class="admin-card-title">标题</h3>
  </div>
  <div class="admin-card-body">
    内容
  </div>
</div>

<!-- 统计卡片 -->
<div class="admin-stat-card">
  <div class="admin-stat-label">用户总数</div>
  <div class="admin-stat-value">12,580</div>
  <div class="admin-stat-trend up">+12.5%</div>
</div>

<!-- 交互卡片 -->
<div class="admin-card admin-card-interactive">
  悬浮时会上浮
</div>
```

#### 按钮样式 (需求21 F部分)

```html
<!-- 主要按钮 -->
<button class="admin-btn admin-btn-primary">主要操作</button>

<!-- 危险按钮 -->
<button class="admin-btn admin-btn-danger">删除</button>

<!-- 警告按钮 -->
<button class="admin-btn admin-btn-warning">警告</button>

<!-- 次要按钮 -->
<button class="admin-btn admin-btn-secondary">取消</button>

<!-- 按钮组 -->
<div class="admin-btn-group">
  <button class="admin-btn admin-btn-primary">确定</button>
  <button class="admin-btn admin-btn-secondary">取消</button>
</div>
```

#### 表单样式 (需求21 E部分)

```html
<div class="admin-form">
  <div class="admin-form-item">
    <label class="admin-form-label">
      <i class="icon">📧</i>
      邮箱地址
    </label>
    <input class="admin-form-input" type="email" />
  </div>

  <div class="admin-form-item is-error">
    <label class="admin-form-label">密码</label>
    <input class="admin-form-input" type="password" />
    <div class="admin-form-error">密码不能为空</div>
  </div>

  <div class="admin-form-item is-success">
    <label class="admin-form-label">用户名</label>
    <input class="admin-form-input" type="text" />
    <div class="admin-form-success">用户名可用</div>
  </div>
</div>
```

#### 加载和骨架屏 (需求21 H部分)

```html
<!-- 骨架屏 -->
<div class="admin-skeleton">
  <div class="admin-skeleton-line"></div>
  <div class="admin-skeleton-line"></div>
  <div class="admin-skeleton-circle"></div>
  <div class="admin-skeleton-rect"></div>
</div>

<!-- 加载动画 -->
<div class="admin-loading">
  <div class="admin-loading-spinner"></div>
  <span class="admin-loading-text">加载中...</span>
</div>

<!-- 加载进度 -->
<div class="admin-loading-progress">
  <div class="admin-loading-progress-bar">
    <div class="admin-loading-progress-fill" style="width: 60%"></div>
  </div>
  <div class="admin-loading-progress-text">60%</div>
</div>
```

#### 空状态 (需求21 I部分)

```html
<div class="admin-empty">
  <img src="/empty.svg" class="admin-empty-image" />
  <div class="admin-empty-title">暂无数据</div>
  <div class="admin-empty-description">
    还没有任何内容，快去添加吧
  </div>
  <div class="admin-empty-action">
    <button class="admin-btn admin-btn-primary">添加内容</button>
  </div>
</div>

<!-- 搜索无结果 -->
<div class="admin-no-result">
  <div class="admin-no-result-icon">🔍</div>
  <div class="admin-no-result-text">未找到相关内容</div>
</div>
```

#### 通知 (需求21 G部分)

```html
<div class="admin-notification">
  <div class="admin-notification-item success">
    <div class="admin-notification-icon">✓</div>
    <div class="admin-notification-content">
      <div class="admin-notification-title">操作成功</div>
      <div class="admin-notification-message">数据已保存</div>
    </div>
    <div class="admin-notification-close">×</div>
  </div>
</div>
```

### 4. 动画效果 (需求21 J部分)

```html
<!-- 淡入动画 -->
<div class="admin-fade-in">内容</div>

<!-- 滑入动画 -->
<div class="admin-slide-in">内容</div>

<!-- 滑出动画 -->
<div class="admin-slide-out">内容</div>

<!-- 数据更新动画 -->
<div class="admin-data-update">更新的内容</div>
```

### 5. 渐变背景

```html
<!-- 主色渐变 -->
<div class="admin-gradient-primary">内容</div>

<!-- 辅色渐变 -->
<div class="admin-gradient-secondary">内容</div>

<!-- 成功渐变 -->
<div class="admin-gradient-success">内容</div>

<!-- 危险渐变 -->
<div class="admin-gradient-danger">内容</div>
```

### 6. 毛玻璃效果

```html
<div class="admin-glass">
  毛玻璃效果内容
</div>
```

### 7. 个性化设置 (需求21 K部分)

```html
<div class="admin-theme-settings">
  <div class="admin-theme-settings-item">
    <div>
      <div class="admin-theme-settings-label">主题模式</div>
      <div class="admin-theme-settings-description">切换明亮/暗黑模式</div>
    </div>
    <el-switch v-model="isDark" />
  </div>

  <div class="admin-theme-settings-item">
    <div>
      <div class="admin-theme-settings-label">主题色</div>
      <div class="admin-theme-settings-description">选择您喜欢的主题色</div>
    </div>
    <div class="admin-color-picker">
      <div class="admin-color-option active" style="background: #165DFF"></div>
      <div class="admin-color-option" style="background: #00B42A"></div>
      <div class="admin-color-option" style="background: #FF7D00"></div>
    </div>
  </div>

  <div class="admin-theme-settings-item">
    <div>
      <div class="admin-theme-settings-label">字体大小</div>
    </div>
    <el-slider v-model="fontSize" :min="12" :max="18" class="admin-font-size-slider" />
  </div>
</div>
```

## CSS变量

系统使用CSS变量来管理主题色，可以通过修改变量来自定义主题：

```css
:root {
  /* 主题色 */
  --admin-primary: #165DFF;
  --admin-secondary: #FF7D00;
  
  /* 功能色 */
  --admin-success: #00B42A;
  --admin-warning: #FF7D00;
  --admin-danger: #F53F3F;
  --admin-info: #165DFF;
  
  /* 中性色 */
  --admin-bg: #F5F7FA;
  --admin-bg-light: #FFFFFF;
  --admin-text: #1D2129;
  
  /* 阴影 */
  --admin-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --admin-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --admin-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  
  /* 圆角 */
  --admin-radius-sm: 4px;
  --admin-radius-md: 8px;
  --admin-radius-lg: 12px;
  
  /* 动画时长 */
  --admin-transition-fast: 0.2s;
  --admin-transition-normal: 0.3s;
  --admin-transition-slow: 0.5s;
}
```

## 暗黑模式

切换暗黑模式：

```javascript
// 启用暗黑模式
document.documentElement.classList.add('dark');

// 禁用暗黑模式
document.documentElement.classList.remove('dark');

// 切换暗黑模式
document.documentElement.classList.toggle('dark');
```

## 响应式设计

所有组件都支持响应式设计，会根据屏幕尺寸自动调整布局：

- **桌面端** (>1200px): 完整布局
- **平板端** (768px-1200px): 适配布局
- **移动端** (<768px): 移动优化布局

## 最佳实践

1. **使用预设组件**: 优先使用 `AdminChart`、`AdminTable` 等预设组件
2. **保持一致性**: 使用统一的样式类和颜色变量
3. **注重性能**: 避免过度使用动画和阴影效果
4. **响应式优先**: 确保所有页面在不同设备上都能正常显示
5. **无障碍访问**: 使用语义化HTML和适当的ARIA属性

## 参考资料

- [Element Plus 文档](https://element-plus.org/)
- [ECharts 文档](https://echarts.apache.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
