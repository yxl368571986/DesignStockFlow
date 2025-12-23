<!--
  响应式图片组件
  
  功能：
  - 支持响应式图片（picture标签、srcset）
  - 自动选择WebP格式（如果浏览器支持）
  - 支持懒加载
  - 支持占位图和加载失败处理
  - 支持CDN加速
  
  需求: 性能优化（图片优化）
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getCDNImageUrl,
  generateSrcSet,
  generateSizes,
  isWebPSupported,
  type ImageSize
} from '@/utils/imageOptimization';
import { Loading, Picture } from '@element-plus/icons-vue';

/**
 * 响应式图片组件Props
 */
interface ResponsiveImageProps {
  /** 图片路径 */
  src: string;
  /** 图片alt文本 */
  alt?: string;
  /** 响应式尺寸 */
  sizes?: ImageSize[];
  /** 图片质量 0-100 */
  quality?: number;
  /** 是否懒加载 */
  lazy?: boolean;
  /** 占位图 */
  placeholder?: string;
  /** 加载失败图片 */
  errorImage?: string;
  /** 图片适应方式 */
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** 自定义类名 */
  customClass?: string;
  /** 是否使用picture标签 */
  usePicture?: boolean;
  /** 响应式断点配置 */
  breakpoints?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

const props = withDefaults(defineProps<ResponsiveImageProps>(), {
  alt: '',
  sizes: () => ['small', 'medium', 'large'],
  quality: 80,
  lazy: true,
  placeholder:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f5f7fa" width="400" height="300"/%3E%3C/svg%3E',
  errorImage: '',
  fit: 'cover',
  customClass: '',
  usePicture: true
});

// 状态
const isLoading = ref(true);
const hasError = ref(false);
const imageRef = ref<HTMLImageElement | null>(null);

// 计算属性：是否支持WebP
const supportsWebP = ref(false);

onMounted(() => {
  supportsWebP.value = isWebPSupported();
});

// 计算属性：WebP格式的srcset
const webpSrcSet = computed(() => {
  if (!supportsWebP.value || !props.src) {
    return '';
  }
  return generateSrcSet(props.src, props.sizes, 'webp');
});

// 计算属性：JPEG格式的srcset（降级方案）
const jpegSrcSet = computed(() => {
  if (!props.src) {
    return '';
  }
  return generateSrcSet(props.src, props.sizes, 'jpg');
});

// 计算属性：sizes属性
const sizesAttr = computed(() => {
  return generateSizes(props.breakpoints);
});

// 计算属性：默认图片URL
const defaultSrc = computed(() => {
  if (!props.src) {
    return props.placeholder;
  }
  const format = supportsWebP.value ? 'webp' : 'jpg';
  return getCDNImageUrl(props.src, {
    size: 'medium',
    quality: props.quality,
    format
  });
});

// 处理图片加载完成
function handleLoad() {
  isLoading.value = false;
  hasError.value = false;
}

// 处理图片加载失败
function handleError() {
  isLoading.value = false;
  hasError.value = true;

  // 如果有错误图片，设置为错误图片
  if (props.errorImage && imageRef.value) {
    imageRef.value.src = props.errorImage;
  }
}

// 处理图片点击
function handleClick(event: MouseEvent) {
  emit('click', event);
}

// Emits
const emit = defineEmits<{
  load: [];
  error: [];
  click: [event: MouseEvent];
}>();

// 监听加载完成
function onImageLoad() {
  handleLoad();
  emit('load');
}

// 监听加载失败
function onImageError() {
  handleError();
  emit('error');
}
</script>

<template>
  <div
    class="responsive-image-wrapper"
    :class="[customClass, { loading: isLoading, error: hasError }]"
  >
    <!-- 使用picture标签实现响应式图片 -->
    <picture v-if="usePicture && src">
      <!-- WebP格式（如果支持） -->
      <source
        v-if="supportsWebP && webpSrcSet"
        type="image/webp"
        :srcset="webpSrcSet"
        :sizes="sizesAttr"
      >

      <!-- JPEG格式（降级方案） -->
      <source
        type="image/jpeg"
        :srcset="jpegSrcSet"
        :sizes="sizesAttr"
      >

      <!-- 默认img标签 -->
      <img
        ref="imageRef"
        :src="defaultSrc"
        :alt="alt"
        :loading="lazy ? 'lazy' : 'eager'"
        :class="['responsive-image', `fit-${fit}`]"
        @load="onImageLoad"
        @error="onImageError"
        @click="handleClick"
      >
    </picture>

    <!-- 不使用picture标签（简单模式） -->
    <img
      v-else
      ref="imageRef"
      :src="defaultSrc"
      :alt="alt"
      :loading="lazy ? 'lazy' : 'eager'"
      :srcset="jpegSrcSet"
      :sizes="sizesAttr"
      :class="['responsive-image', `fit-${fit}`]"
      @load="onImageLoad"
      @error="onImageError"
      @click="handleClick"
    >

    <!-- 加载中占位 -->
    <div
      v-if="isLoading"
      class="image-placeholder"
    >
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
    </div>

    <!-- 加载失败占位 -->
    <div
      v-if="hasError && !errorImage"
      class="image-error"
    >
      <el-icon>
        <Picture />
      </el-icon>
      <span>加载失败</span>
    </div>
  </div>
</template>

<style scoped>
.responsive-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f7fa;
}

.responsive-image {
  width: 100%;
  height: 100%;
  display: block;
  transition: opacity 0.3s ease;
}

/* 图片适应方式 */
.responsive-image.fit-contain {
  object-fit: contain;
}

.responsive-image.fit-cover {
  object-fit: cover;
}

.responsive-image.fit-fill {
  object-fit: fill;
}

.responsive-image.fit-none {
  object-fit: none;
}

.responsive-image.fit-scale-down {
  object-fit: scale-down;
}

/* 加载中状态 */
.responsive-image-wrapper.loading .responsive-image {
  opacity: 0;
}

/* 错误状态 */
.responsive-image-wrapper.error .responsive-image {
  opacity: 0.3;
}

/* 占位符 */
.image-placeholder,
.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  pointer-events: none;
}

.image-placeholder .el-icon {
  font-size: 32px;
}

.image-error {
  gap: 8px;
}

.image-error .el-icon {
  font-size: 40px;
}

.image-error span {
  font-size: 12px;
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .responsive-image {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .responsive-image-wrapper {
    background: #2b2b2b;
  }

  .image-placeholder,
  .image-error {
    background: #2b2b2b;
    color: #a8abb2;
  }
}
</style>
