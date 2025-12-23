<!--
  404页面组件
  
  功能：
  - 显示404错误信息
  - 提供返回首页按钮
  - 提供搜索功能
  - 响应式设计
  
  需求: 需求1（页面路由）
-->

<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <!-- 404图标 -->
      <div class="not-found-icon">
        <el-icon :size="120">
          <WarningFilled />
        </el-icon>
      </div>

      <!-- 404标题 -->
      <h1 class="not-found-title">
        404
      </h1>

      <!-- 描述文本 -->
      <p class="not-found-description">
        抱歉，您访问的页面不存在
      </p>

      <!-- 操作按钮 -->
      <div class="not-found-actions">
        <el-button
          type="primary"
          size="large"
          @click="goHome"
        >
          <el-icon class="mr-1">
            <HomeFilled />
          </el-icon>
          返回首页
        </el-button>

        <el-button
          size="large"
          @click="goBack"
        >
          <el-icon class="mr-1">
            <Back />
          </el-icon>
          返回上一页
        </el-button>
      </div>

      <!-- 搜索建议 -->
      <div class="not-found-search">
        <p class="search-hint">
          或者尝试搜索您需要的资源：
        </p>
        <SearchBar
          placeholder="搜索设计资源..."
          :show-suggestions="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { WarningFilled, HomeFilled, Back } from '@element-plus/icons-vue';
import SearchBar from '@/components/business/SearchBar.vue';

const router = useRouter();

/**
 * 返回首页
 */
function goHome(): void {
  router.push('/');
}

/**
 * 返回上一页
 */
function goBack(): void {
  router.back();
}
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  padding: 24px;
}

.not-found-content {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.not-found-icon {
  margin-bottom: 24px;
  color: #909399;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.not-found-title {
  margin: 0 0 16px;
  font-size: 72px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.not-found-description {
  margin: 0 0 32px;
  font-size: 18px;
  color: #606266;
}

.not-found-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 48px;
}

.not-found-search {
  padding-top: 32px;
  border-top: 1px solid #dcdfe6;
}

.search-hint {
  margin: 0 0 16px;
  font-size: 14px;
  color: #909399;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .not-found-page {
    padding: 16px;
  }

  .not-found-icon {
    :deep(.el-icon) {
      font-size: 80px !important;
    }
  }

  .not-found-title {
    font-size: 48px;
  }

  .not-found-description {
    font-size: 16px;
  }

  .not-found-actions {
    flex-direction: column;
    gap: 12px;

    .el-button {
      width: 100%;
    }
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .not-found-page {
    background: linear-gradient(135deg, #1d1e1f 0%, #2c2d2e 100%);
  }

  .not-found-icon {
    color: #a8abb2;
  }

  .not-found-title {
    color: #e5eaf3;
  }

  .not-found-description {
    color: #c9cdd4;
  }

  .not-found-search {
    border-top-color: #4e5969;
  }

  .search-hint {
    color: #86909c;
  }
}
</style>
