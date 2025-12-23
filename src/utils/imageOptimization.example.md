# 图片优化工具使用示例

## 概述

图片优化工具提供了一套完整的图片处理和优化功能，包括：
- Canvas图片压缩
- 响应式图片URL生成
- WebP格式自动检测和支持
- CDN加速
- 图片元信息获取

## 基础使用

### 1. 图片压缩

```typescript
import { compressImage } from '@/utils/imageOptimization';

// 压缩图片
const file = event.target.files[0];
const compressed = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  mimeType: 'image/jpeg'
});

// 转换为File对象
const compressedFile = new File([compressed], 'compressed.jpg', {
  type: 'image/jpeg'
});
```

### 2. 批量压缩

```typescript
import { compressImages } from '@/utils/imageOptimization';

const files = Array.from(event.target.files);
const compressed = await compressImages(
  files,
  { quality: 0.8 },
  (current, total) => {
    console.log(`压缩进度: ${current}/${total}`);
  }
);
```

### 3. WebP支持检测

```typescript
import { checkWebPSupport, isWebPSupported } from '@/utils/imageOptimization';

// 异步检测（首次调用）
const supported = await checkWebPSupport();

// 同步获取（使用缓存结果）
if (isWebPSupported()) {
  console.log('浏览器支持WebP');
}
```

### 4. CDN图片URL生成

```typescript
import { getCDNImageUrl } from '@/utils/imageOptimization';

// 基础用法
const url = getCDNImageUrl('/images/resource.jpg');

// 指定尺寸
const smallUrl = getCDNImageUrl('/images/resource.jpg', {
  size: 'small' // 400px
});

// 自定义宽高
const customUrl = getCDNImageUrl('/images/resource.jpg', {
  width: 800,
  height: 600,
  quality: 85,
  format: 'webp'
});
```

### 5. 响应式图片

```typescript
import { generateSrcSet, generateSizes } from '@/utils/imageOptimization';

// 生成srcset
const srcset = generateSrcSet('/images/resource.jpg', ['small', 'medium', 'large']);
// 结果: "https://cdn.../resource.jpg?w=400 400w, https://cdn.../resource.jpg?w=800 800w, ..."

// 生成sizes属性
const sizes = generateSizes({
  mobile: '100vw',
  tablet: '50vw',
  desktop: '33vw'
});
// 结果: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
```

### 6. 优化后的图片URL（自动WebP）

```typescript
import { getOptimizedImageUrl } from '@/utils/imageOptimization';

// 自动选择WebP或JPEG
const url = getOptimizedImageUrl('/images/resource.jpg', 'medium', 80);
// 如果浏览器支持WebP: https://cdn.../resource.jpg?w=800&q=80&f=webp
// 否则: https://cdn.../resource.jpg?w=800&q=80&f=jpg
```

### 7. 图片元信息

```typescript
import { getImageMetadata } from '@/utils/imageOptimization';

const file = event.target.files[0];
const metadata = await getImageMetadata(file);
console.log(metadata);
// { width: 1920, height: 1080, size: 2048576, type: 'image/jpeg' }
```

### 8. 生成缩略图

```typescript
import { generateThumbnail } from '@/utils/imageOptimization';

const file = event.target.files[0];
const thumbnail = await generateThumbnail(file, 200, 0.7);
// 生成200x200的缩略图，质量0.7
```

## 在组件中使用

### 使用 ResponsiveImage 组件

```vue
<template>
  <ResponsiveImage
    :src="resource.cover"
    :alt="resource.title"
    :sizes="['small', 'medium', 'large']"
    :quality="80"
    :lazy="true"
    fit="cover"
    use-picture
    @load="handleImageLoad"
    @error="handleImageError"
  />
</template>

<script setup lang="ts">
import ResponsiveImage from '@/components/common/ResponsiveImage.vue';

function handleImageLoad() {
  console.log('图片加载完成');
}

function handleImageError() {
  console.log('图片加载失败');
}
</script>
```

### 使用 useImageOptimization Composable

```vue
<template>
  <div>
    <input type="file" @change="handleFileChange" multiple />
    <div v-if="isCompressing">
      压缩进度: {{ compressProgress }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageOptimization } from '@/composables/useImageOptimization';

const {
  isCompressing,
  compressProgress,
  compressBatch,
  getOptimizedUrl
} = useImageOptimization();

async function handleFileChange(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files || []);
  
  // 批量压缩
  const compressed = await compressBatch(files, {
    maxWidth: 1920,
    quality: 0.8
  });
  
  console.log('压缩完成:', compressed);
}

// 获取优化后的URL
const imageUrl = getOptimizedUrl('/images/resource.jpg', 'medium');
</script>
```

### 使用 useImagePreload Composable

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useImagePreload } from '@/composables/useImageOptimization';

const { preloadBatch, isPreloading, preloadProgress } = useImagePreload();

onMounted(async () => {
  // 预加载关键图片
  await preloadBatch([
    '/images/banner1.jpg',
    '/images/banner2.jpg',
    '/images/banner3.jpg'
  ]);
  
  console.log('图片预加载完成');
});
</script>
```

## 高级用法

### 1. 自适应图片质量

```typescript
import { detectDevicePerformance } from '@/utils/performance';
import { compressImage } from '@/utils/imageOptimization';

const device = detectDevicePerformance();
const quality = device.isLowEnd ? 0.6 : 0.8;

const compressed = await compressImage(file, { quality });
```

### 2. 渐进式图片加载

```vue
<template>
  <div class="progressive-image">
    <!-- 低质量占位图 -->
    <img
      v-if="!isLoaded"
      :src="thumbnailUrl"
      class="thumbnail"
      alt=""
    />
    
    <!-- 高质量图片 -->
    <img
      :src="fullUrl"
      class="full-image"
      :class="{ loaded: isLoaded }"
      @load="isLoaded = true"
      alt=""
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getCDNImageUrl } from '@/utils/imageOptimization';

const props = defineProps<{ src: string }>();

const isLoaded = ref(false);
const thumbnailUrl = getCDNImageUrl(props.src, { width: 50, quality: 50 });
const fullUrl = getCDNImageUrl(props.src, { size: 'large', quality: 85 });
</script>

<style scoped>
.progressive-image {
  position: relative;
}

.thumbnail {
  filter: blur(10px);
  transform: scale(1.1);
}

.full-image {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.full-image.loaded {
  opacity: 1;
}
</style>
```

### 3. 图片懒加载 + 响应式

```vue
<template>
  <picture>
    <source
      v-if="supportsWebP"
      type="image/webp"
      :srcset="webpSrcSet"
      :sizes="sizesAttr"
    />
    <source
      type="image/jpeg"
      :srcset="jpegSrcSet"
      :sizes="sizesAttr"
    />
    <img
      :src="defaultSrc"
      :alt="alt"
      loading="lazy"
      @load="handleLoad"
    />
  </picture>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useImageOptimization } from '@/composables/useImageOptimization';

const props = defineProps<{ src: string; alt: string }>();

const { supportsWebP, getSrcSet, getSizes, getCDNUrl } = useImageOptimization();

const webpSrcSet = computed(() => getSrcSet(props.src, ['small', 'medium', 'large'], 'webp'));
const jpegSrcSet = computed(() => getSrcSet(props.src, ['small', 'medium', 'large'], 'jpg'));
const sizesAttr = computed(() => getSizes());
const defaultSrc = computed(() => getCDNUrl(props.src, { size: 'medium' }));

function handleLoad() {
  console.log('图片加载完成');
}
</script>
```

## 性能优化建议

### 1. 图片尺寸选择

- 缩略图: 200px (thumbnail)
- 列表卡片: 400px (small)
- 详情页预览: 800px (medium)
- 全屏查看: 1200px (large)
- 高清大图: 1920px (xlarge)

### 2. 压缩质量建议

- 缩略图: 0.6-0.7
- 普通图片: 0.8
- 高质量图片: 0.85-0.9
- 无损压缩: 1.0

### 3. 格式选择

- 照片: JPEG/WebP
- 图标/Logo: PNG/WebP
- 矢量图: SVG

### 4. 懒加载策略

```typescript
// 首屏图片立即加载
<img src="..." loading="eager" />

// 非首屏图片懒加载
<img src="..." loading="lazy" />
```

### 5. CDN配置

```typescript
// .env.production
VITE_CDN_BASE_URL=https://cdn.startide-design.com

// 使用CDN
const url = getCDNImageUrl('/images/resource.jpg');
```

## 注意事项

1. **浏览器兼容性**
   - WebP: Chrome 23+, Firefox 65+, Safari 14+
   - loading="lazy": Chrome 77+, Firefox 75+, Safari 15.4+

2. **图片大小限制**
   - 建议单张图片不超过5MB
   - 压缩后建议不超过500KB

3. **CDN缓存**
   - 图片URL应包含版本号或hash
   - 设置合适的缓存时间（建议30天）

4. **性能监控**
   - 监控图片加载时间
   - 监控LCP指标
   - 优化首屏图片加载

## 相关文档

- [响应式图片组件](../components/common/ResponsiveImage.vue)
- [图片优化Composable](../composables/useImageOptimization.ts)
- [性能优化工具](./performance.ts)
