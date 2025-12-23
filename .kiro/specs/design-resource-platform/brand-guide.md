# 星潮设计 - 品牌设计指南

## 品牌概述

**星潮设计（StarTide Design）** 是一个专业的设计资源分享平台，致力于为设计师和创意工作者提供高质量的设计素材。

### 品牌理念
- **星**：代表创意的闪耀和灵感的迸发
- **潮**：代表设计的潮流和趋势的引领

---

## 1. 品牌标识（Logo）

### 1.1 Logo设计方案

#### 方案A：文字+图标组合
```
┌─────────────────────────┐
│   ★                     │
│  ★ ★  星潮设计          │
│   ★                     │
│  StarTide Design        │
└─────────────────────────┘
```

**设计元素：**
- 星星图标：3颗星星组成三角形，象征创意、品质、专业
- 中文标识：星潮设计（主标识）
- 英文标识：StarTide Design（副标识）

#### 方案B：波浪+星星组合
```
┌─────────────────────────┐
│   ★  ～～～             │
│  星潮设计               │
│  StarTide Design        │
└─────────────────────────┘
```

**设计元素：**
- 星星：代表创意灵感
- 波浪：代表潮流趋势
- 组合：星光照耀在潮流之上

### 1.2 Logo使用规范

```vue
<!-- 完整Logo（桌面端） -->
<template>
  <div class="logo-full">
    <div class="logo-icon">
      <!-- SVG星星图标 -->
      <svg viewBox="0 0 100 100" class="w-10 h-10">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#165DFF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FF7D00;stop-opacity:1" />
          </linearGradient>
        </defs>
        <polygon points="50,10 61,35 88,35 67,52 77,77 50,60 23,77 33,52 12,35 39,35" 
                 fill="url(#logoGradient)" />
      </svg>
    </div>
    <div class="logo-text">
      <h1 class="text-xl font-bold bg-gradient-to-r from-[#165DFF] to-[#FF7D00] bg-clip-text text-transparent">
        星潮设计
      </h1>
      <p class="text-xs text-gray-500">StarTide Design</p>
    </div>
  </div>
</template>

<style scoped>
.logo-full {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo-full:hover {
  transform: scale(1.05);
}
</style>
```

```vue
<!-- 简化Logo（移动端） -->
<template>
  <div class="logo-simple">
    <svg viewBox="0 0 100 100" class="w-8 h-8">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#165DFF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FF7D00;stop-opacity:1" />
        </linearGradient>
      </defs>
      <polygon points="50,10 61,35 88,35 67,52 77,77 50,60 23,77 33,52 12,35 39,35" 
               fill="url(#logoGradient)" />
    </svg>
    <span class="text-lg font-bold bg-gradient-to-r from-[#165DFF] to-[#FF7D00] bg-clip-text text-transparent">
      星潮
    </span>
  </div>
</template>
```

---

## 2. 品牌色彩

### 2.1 主色调

```css
/* 主色调 - 专业蓝 */
--primary-color: #165DFF;
--primary-light: #4080FF;
--primary-dark: #0E42D2;

/* 辅助色 - 活力橙 */
--secondary-color: #FF7D00;
--secondary-light: #FFA940;
--secondary-dark: #D66A00;

/* 渐变色 */
--gradient-primary: linear-gradient(135deg, #165DFF 0%, #FF7D00 100%);
--gradient-light: linear-gradient(135deg, #4080FF 0%, #FFA940 100%);
```

### 2.2 色彩应用场景

| 元素 | 颜色 | 说明 |
|------|------|------|
| Logo | 渐变（蓝→橙） | 品牌标识 |
| 主按钮 | 蓝色 #165DFF | 登录、搜索、确认 |
| 强调按钮 | 橙色 #FF7D00 | 下载、VIP、上传 |
| 链接 | 蓝色 #165DFF | 文字链接 |
| 成功提示 | 绿色 #00B42A | 操作成功 |
| 警告提示 | 橙色 #FF7D00 | 警告信息 |
| 错误提示 | 红色 #F53F3F | 错误信息 |
| 背景渐变 | 蓝→橙渐变 | Hero区域、卡片悬浮 |

### 2.3 Tailwind CSS配置

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'brand-blue': {
          DEFAULT: '#165DFF',
          light: '#4080FF',
          dark: '#0E42D2'
        },
        'brand-orange': {
          DEFAULT: '#FF7D00',
          light: '#FFA940',
          dark: '#D66A00'
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #165DFF 0%, #FF7D00 100%)',
        'brand-gradient-light': 'linear-gradient(135deg, #4080FF 0%, #FFA940 100%)'
      }
    }
  }
}
```

---

## 3. 水印设计

### 3.1 水印样式规范

```typescript
// 水印配置
interface WatermarkConfig {
  text: string;           // "星潮设计"
  resourceId: string;     // 资源ID
  opacity: number;        // 0.6（60%透明度）
  fontSize: number;       // 根据图片尺寸自适应
  color: string;          // "#FFFFFF"（白色）
  angle: number;          // -45度（斜向）
  position: 'center' | 'tile'; // 居中或平铺
}
```

### 3.2 水印实现（前端CSS方案）

```vue
<template>
  <div class="image-with-watermark">
    <img :src="imageSrc" :alt="title" />
    <div class="watermark">
      <div class="watermark-content">
        <span class="watermark-brand">星潮设计</span>
        <span class="watermark-id">ID: {{ resourceId }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  imageSrc: string;
  title: string;
  resourceId: string;
}>();
</script>

<style scoped>
.image-with-watermark {
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-drag: none;
}

.image-with-watermark img {
  width: 100%;
  height: auto;
  display: block;
  pointer-events: none;
}

.watermark {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.watermark-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transform: rotate(-45deg);
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  font-weight: bold;
  white-space: nowrap;
}

.watermark-brand {
  font-size: clamp(1.5rem, 5vw, 3rem);
  letter-spacing: 0.2em;
}

.watermark-id {
  font-size: clamp(0.875rem, 2vw, 1.25rem);
  opacity: 0.8;
}

/* 平铺水印（可选） */
.watermark-tile {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 200px,
    rgba(255, 255, 255, 0.05) 200px,
    rgba(255, 255, 255, 0.05) 400px
  );
}

.watermark-tile::before {
  content: '星潮设计';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 3rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  pointer-events: none;
}
</style>
```

### 3.3 防盗图措施

```vue
<template>
  <div 
    class="protected-image"
    @contextmenu.prevent
    @dragstart.prevent
  >
    <img 
      :src="imageSrc" 
      :alt="title"
      draggable="false"
    />
  </div>
</template>

<style scoped>
.protected-image {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.protected-image img {
  pointer-events: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
}
</style>
```

---

## 4. 首页品牌展示

### 4.1 Hero区域设计

```vue
<template>
  <section class="hero-section">
    <div class="container mx-auto px-4 py-20 text-center">
      <!-- 主标题 -->
      <h1 class="hero-title">
        <span class="brand-name">星潮设计</span>
        <span class="brand-slogan">创意无限，设计无界</span>
      </h1>
      
      <!-- 副标题 -->
      <p class="hero-subtitle">
        专业设计资源分享平台，汇聚百万优质素材
      </p>
      
      <!-- CTA按钮 -->
      <div class="hero-actions">
        <button class="btn-primary">
          开始探索
        </button>
        <button class="btn-secondary">
          上传作品
        </button>
      </div>
      
      <!-- 特色标签 -->
      <div class="hero-features">
        <div class="feature-item">
          <span class="feature-icon">⚡</span>
       