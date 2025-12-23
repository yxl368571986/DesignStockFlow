<!--
  BannerCarousel 组件演示
  展示轮播图组件的各种用法
-->

<template>
  <div class="banner-carousel-demo">
    <h1>BannerCarousel 轮播图组件演示</h1>

    <!-- 基础用法 -->
    <section class="demo-section">
      <h2>基础用法</h2>
      <p>默认高度：桌面端400px，移动端200px</p>
      <BannerCarousel
        @change="handleChange"
        @click="handleClick"
      />
    </section>

    <!-- 自定义高度 -->
    <section class="demo-section">
      <h2>自定义高度</h2>
      <p>桌面端500px，移动端250px</p>
      <BannerCarousel
        height="500px"
        mobile-height="250px"
      />
    </section>

    <!-- 小尺寸轮播图 -->
    <section class="demo-section">
      <h2>小尺寸轮播图</h2>
      <p>桌面端300px，移动端150px</p>
      <BannerCarousel
        height="300px"
        mobile-height="150px"
      />
    </section>

    <!-- 事件监听 -->
    <section class="demo-section">
      <h2>事件监听</h2>
      <p>当前轮播图索引: {{ currentIndex }}</p>
      <p v-if="clickedBanner">
        最后点击的轮播图: {{ clickedBanner.title }}
      </p>
      <BannerCarousel
        @change="handleChangeWithLog"
        @click="handleClickWithLog"
      />
    </section>

    <!-- 数据状态展示 -->
    <section class="demo-section">
      <h2>数据状态</h2>
      <div class="status-info">
        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="轮播图总数">
            {{ configStore.banners.length }}
          </el-descriptions-item>
          <el-descriptions-item label="激活的轮播图">
            {{ configStore.activeBanners.length }}
          </el-descriptions-item>
          <el-descriptions-item label="加载状态">
            <el-tag :type="configStore.loading.banners ? 'warning' : 'success'">
              {{ configStore.loading.banners ? '加载中' : '已加载' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="错误信息">
            {{ configStore.error.banners || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </section>

    <!-- 操作按钮 -->
    <section class="demo-section">
      <h2>操作</h2>
      <el-space>
        <el-button
          type="primary"
          @click="refreshBanners"
        >
          刷新轮播图数据
        </el-button>
        <el-button @click="clearCache">
          清除缓存
        </el-button>
        <el-button @click="showBannerList">
          查看轮播图列表
        </el-button>
      </el-space>
    </section>

    <!-- 轮播图列表对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="轮播图列表"
      width="80%"
    >
      <el-table
        :data="configStore.banners"
        border
      >
        <el-table-column
          prop="bannerId"
          label="ID"
          width="100"
        />
        <el-table-column
          prop="title"
          label="标题"
        />
        <el-table-column
          prop="linkType"
          label="链接类型"
          width="100"
        />
        <el-table-column
          prop="sort"
          label="排序"
          width="80"
        />
        <el-table-column
          prop="status"
          label="状态"
          width="80"
        >
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="时间范围"
          width="200"
        >
          <template #default="{ row }">
            <div
              v-if="row.startTime && row.endTime"
              class="time-range"
            >
              <div>{{ formatDate(row.startTime) }}</div>
              <div>{{ formatDate(row.endTime) }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="是否激活"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="isActiveBanner(row) ? 'success' : 'info'">
              {{ isActiveBanner(row) ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import BannerCarousel from './BannerCarousel.vue';
import { useConfigStore } from '@/pinia/configStore';
import type { BannerInfo } from '@/types/models';

// ========== Composables ==========
const configStore = useConfigStore();

// ========== 状态 ==========
const currentIndex = ref(0);
const clickedBanner = ref<BannerInfo | null>(null);
const dialogVisible = ref(false);

// ========== 方法 ==========

/**
 * 处理轮播图切换
 */
function handleChange(index: number): void {
  console.log('轮播图切换到索引:', index);
}

/**
 * 处理轮播图点击
 */
function handleClick(banner: BannerInfo): void {
  console.log('点击轮播图:', banner);
}

/**
 * 处理轮播图切换（带日志）
 */
function handleChangeWithLog(index: number): void {
  currentIndex.value = index;
  ElMessage.info(`切换到第 ${index + 1} 张轮播图`);
}

/**
 * 处理轮播图点击（带日志）
 */
function handleClickWithLog(banner: BannerInfo): void {
  clickedBanner.value = banner;
  ElMessage.success(`点击了轮播图: ${banner.title}`);
}

/**
 * 刷新轮播图数据
 */
async function refreshBanners(): Promise<void> {
  try {
    await configStore.fetchBanners(true);
    ElMessage.success('轮播图数据已刷新');
  } catch (error) {
    ElMessage.error('刷新失败: ' + (error as Error).message);
  }
}

/**
 * 清除缓存
 */
function clearCache(): void {
  configStore.clearCache('BANNERS');
  ElMessage.success('缓存已清除');
}

/**
 * 显示轮播图列表
 */
function showBannerList(): void {
  dialogVisible.value = true;
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 判断轮播图是否激活
 */
function isActiveBanner(banner: BannerInfo): boolean {
  if (banner.status !== 1) {
    return false;
  }

  if (banner.startTime && banner.endTime) {
    const now = new Date().getTime();
    const startTime = new Date(banner.startTime).getTime();
    const endTime = new Date(banner.endTime).getTime();
    return now >= startTime && now <= endTime;
  }

  return true;
}

// ========== 生命周期 ==========
onMounted(async () => {
  // 加载轮播图数据
  try {
    await configStore.fetchBanners();
  } catch (error) {
    console.error('Failed to load banners:', error);
  }
});
</script>

<style scoped lang="scss">
.banner-carousel-demo {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    font-size: 32px;
    font-weight: 600;
    color: #165dff;
    margin-bottom: 32px;
    text-align: center;
  }

  .demo-section {
    margin-bottom: 48px;
    padding: 24px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    h2 {
      font-size: 24px;
      font-weight: 500;
      color: #333;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #165dff;
    }

    p {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }

    .status-info {
      margin-top: 16px;
    }

    .time-range {
      font-size: 12px;
      line-height: 1.5;

      div {
        color: #666;
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .banner-carousel-demo {
    padding: 16px;

    h1 {
      font-size: 24px;
      margin-bottom: 24px;
    }

    .demo-section {
      padding: 16px;
      margin-bottom: 32px;

      h2 {
        font-size: 20px;
        margin-bottom: 12px;
      }
    }
  }
}
</style>
