<!--
  轮播图组件
  功能：
  - 自动轮播（3秒间隔）
  - 指示器（圆点）
  - 左右切换按钮
  - 点击跳转链接
  - 响应式图片（移动端/桌面端不同尺寸）
  - 使用Element Plus的Carousel组件
-->

<template>
  <div class="banner-carousel">
    <el-carousel
      v-if="activeBanners && activeBanners.length > 0"
      :interval="3000"
      :height="carouselHeight"
      arrow="hover"
      indicator-position="outside"
      @change="handleCarouselChange"
    >
      <el-carousel-item
        v-for="banner in activeBanners"
        :key="banner.bannerId"
      >
        <div 
          class="banner-item"
          @click.stop="handleBannerClick(banner)"
        >
          <img
            :src="getBannerImage(banner)"
            :alt="banner.title"
            class="banner-image"
            loading="lazy"
          >
          <div
            v-if="banner.title"
            class="banner-title"
          >
            {{ banner.title }}
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- 空状态 -->
    <div
      v-else
      class="banner-empty"
    >
      <el-empty description="暂无轮播图" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '@/pinia/configStore';
import type { BannerInfo } from '@/types/models';

// ========== Props ==========
interface Props {
  /**
   * 轮播图高度（桌面端）
   * @default '400px'
   */
  height?: string;
  /**
   * 轮播图高度（移动端）
   * @default '200px'
   */
  mobileHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  mobileHeight: '200px'
});

// ========== Emits ==========
const emit = defineEmits<{
  /**
   * 轮播图切换事件
   * @param index 当前轮播图索引
   */
  change: [index: number];
  /**
   * 轮播图点击事件
   * @param banner 被点击的轮播图信息
   */
  click: [banner: BannerInfo];
}>();

// ========== Composables ==========
const router = useRouter();
const configStore = useConfigStore();

// ========== 状态 ==========

/**
 * 当前激活的轮播图索引
 */
const currentIndex = ref(0);

/**
 * 是否为移动端
 */
const isMobile = ref(false);

// ========== 计算属性 ==========

/**
 * 激活的轮播图列表（从Store获取）
 */
const activeBanners = computed(() => {
  const banners = configStore.activeBanners;
  console.log('[BannerCarousel] activeBanners更新:', banners.length, banners);
  return banners;
});

/**
 * 轮播图高度（响应式）
 */
const carouselHeight = computed(() => {
  return isMobile.value ? props.mobileHeight : props.height;
});

// ========== 方法 ==========

/**
 * 获取轮播图图片URL（响应式）
 * 根据设备类型返回不同尺寸的图片
 */
function getBannerImage(banner: BannerInfo): string {
  // 如果后端支持不同尺寸的图片，可以在这里处理
  // 例如：return isMobile.value ? banner.mobileImageUrl : banner.imageUrl;
  // 目前直接返回原图
  return banner.imageUrl;
}

/**
 * 处理轮播图切换
 */
function handleCarouselChange(index: number): void {
  currentIndex.value = index;
  emit('change', index);
}

/**
 * 处理轮播图点击
 */
function handleBannerClick(banner: BannerInfo): void {
  console.log('[BannerCarousel] 点击轮播图:', banner.title, banner);
  console.log('[BannerCarousel] 当前activeBanners数量:', activeBanners.value.length);
  
  emit('click', banner);

  // 根据链接类型进行跳转
  switch (banner.linkType) {
    case 'internal':
      // 内部链接（站内路由）
      console.log('[BannerCarousel] 内部跳转:', banner.linkUrl);
      router.push(banner.linkUrl);
      break;

    case 'external':
      // 外部链接（新标签页打开）
      console.log('[BannerCarousel] 外部跳转:', banner.linkUrl);
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
      break;

    case 'category':
      // 分类页面
      console.log('[BannerCarousel] 分类跳转:', banner.linkUrl);
      router.push(`/resource?category=${banner.linkUrl}`);
      break;

    case 'resource':
      // 资源详情页
      console.log('[BannerCarousel] 资源跳转:', banner.linkUrl);
      router.push(`/resource/${banner.linkUrl}`);
      break;

    default:
      console.warn('Unknown link type:', banner.linkType);
  }
  
  console.log('[BannerCarousel] 跳转完成');
}

/**
 * 检测设备类型
 */
function checkDeviceType(): void {
  isMobile.value = window.innerWidth < 768;
}

/**
 * 处理窗口大小变化
 */
function handleResize(): void {
  checkDeviceType();
}

// ========== 生命周期 ==========

onMounted(() => {
  checkDeviceType();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.banner-carousel {
  width: 100%;
  overflow: hidden;

  // Element Plus Carousel 样式覆盖
  :deep(.el-carousel) {
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.el-carousel__container) {
    height: 100%;
  }

  :deep(.el-carousel__item) {
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.02);
    }
  }

  // 指示器样式
  :deep(.el-carousel__indicators) {
    .el-carousel__indicator {
      .el-carousel__button {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.5);
        transition: all 0.3s ease;
      }

      &.is-active {
        .el-carousel__button {
          width: 24px;
          border-radius: 5px;
          background-color: #165dff;
        }
      }
    }
  }

  // 左右切换按钮样式
  :deep(.el-carousel__arrow) {
    width: 40px;
    height: 40px;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 18px;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(0, 0, 0, 0.7);
    }
  }

  :deep(.el-carousel__arrow--left) {
    left: 20px;
  }

  :deep(.el-carousel__arrow--right) {
    right: 20px;
  }

  // 轮播图项
  .banner-item {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .banner-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .banner-title {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px 24px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
      color: #fff;
      font-size: 18px;
      font-weight: 500;
      text-align: center;
      transition: opacity 0.3s ease;
    }

    &:hover {
      .banner-image {
        transform: scale(1.05);
      }
    }
  }

  // 空状态
  .banner-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    background-color: #f5f7fa;
    border-radius: 8px;
  }
}

// 移动端适配
@media (max-width: 768px) {
  .banner-carousel {
    :deep(.el-carousel) {
      border-radius: 4px;
    }

    // 移动端隐藏左右切换按钮
    :deep(.el-carousel__arrow) {
      display: none;
    }

    // 移动端指示器样式调整
    :deep(.el-carousel__indicators) {
      .el-carousel__indicator {
        .el-carousel__button {
          width: 6px;
          height: 6px;
        }

        &.is-active {
          .el-carousel__button {
            width: 16px;
          }
        }
      }
    }

    .banner-item {
      .banner-title {
        padding: 12px 16px;
        font-size: 14px;
      }
    }

    .banner-empty {
      min-height: 150px;
    }
  }
}

// 平板适配
@media (min-width: 768px) and (max-width: 1200px) {
  .banner-carousel {
    :deep(.el-carousel__arrow) {
      width: 36px;
      height: 36px;
      font-size: 16px;
    }

    :deep(.el-carousel__arrow--left) {
      left: 16px;
    }

    :deep(.el-carousel__arrow--right) {
      right: 16px;
    }

    .banner-item {
      .banner-title {
        font-size: 16px;
      }
    }
  }
}
</style>
