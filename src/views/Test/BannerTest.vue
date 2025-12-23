<!--
  轮播图跳转测试页面
  仅用于测试轮播图跳转功能
  不用于生产环境
-->

<template>
  <div class="banner-test-page">
    <div class="test-header">
      <el-button
        type="primary"
        @click="goBack"
      >
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
    </div>

    <div class="test-content">
      <el-result
        icon="success"
        title="轮播图跳转成功！"
        sub-title="这是一个测试页面，用于验证轮播图跳转功能是否正常工作"
      >
        <template #extra>
          <el-descriptions
            title="跳转信息"
            :column="1"
            border
          >
            <el-descriptions-item label="当前路由">
              {{ currentRoute }}
            </el-descriptions-item>
            <el-descriptions-item label="路由参数">
              {{ routeParams }}
            </el-descriptions-item>
            <el-descriptions-item label="查询参数">
              {{ queryParams }}
            </el-descriptions-item>
            <el-descriptions-item label="跳转时间">
              {{ jumpTime }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="test-actions">
            <el-button
              type="primary"
              size="large"
              @click="goBack"
            >
              返回首页继续测试
            </el-button>
          </div>
        </template>
      </el-result>
    </div>

    <div class="test-info">
      <el-alert
        title="测试说明"
        type="info"
        :closable="false"
      >
        <p>✅ 如果你看到这个页面，说明轮播图跳转功能正常工作</p>
        <p>✅ 点击"返回首页"按钮后，轮播图应该依然存在</p>
        <p>⚠️ 此页面仅用于测试，不会出现在生产环境中</p>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

// 跳转时间
const jumpTime = ref('');

// 当前路由路径
const currentRoute = computed(() => route.path);

// 路由参数
const routeParams = computed(() => {
  return Object.keys(route.params).length > 0
    ? JSON.stringify(route.params, null, 2)
    : '无';
});

// 查询参数
const queryParams = computed(() => {
  return Object.keys(route.query).length > 0
    ? JSON.stringify(route.query, null, 2)
    : '无';
});

// 返回首页
function goBack() {
  router.push('/');
}

onMounted(() => {
  jumpTime.value = new Date().toLocaleString('zh-CN');
});
</script>

<style scoped lang="scss">
.banner-test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;

  .test-header {
    max-width: 1200px;
    margin: 0 auto 40px;
  }

  .test-content {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    :deep(.el-result) {
      padding: 40px 0;
    }

    :deep(.el-result__icon) {
      svg {
        width: 80px;
        height: 80px;
      }
    }

    :deep(.el-result__title) {
      font-size: 28px;
      margin-top: 20px;
    }

    :deep(.el-result__subtitle) {
      font-size: 16px;
      margin-top: 12px;
    }

    :deep(.el-descriptions) {
      margin-top: 40px;
    }

    .test-actions {
      margin-top: 40px;
      text-align: center;
    }
  }

  .test-info {
    max-width: 1200px;
    margin: 40px auto 0;

    :deep(.el-alert) {
      background: rgba(255, 255, 255, 0.95);
      border: none;
      border-radius: 8px;
      padding: 20px;

      p {
        margin: 8px 0;
        font-size: 14px;
        line-height: 1.6;
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .banner-test-page {
    padding: 20px 16px;

    .test-header {
      margin-bottom: 20px;
    }

    .test-content {
      padding: 24px 16px;

      :deep(.el-result__icon) {
        svg {
          width: 60px;
          height: 60px;
        }
      }

      :deep(.el-result__title) {
        font-size: 22px;
      }

      :deep(.el-result__subtitle) {
        font-size: 14px;
      }

      :deep(.el-descriptions) {
        margin-top: 24px;
      }

      .test-actions {
        margin-top: 24px;
      }
    }

    .test-info {
      margin-top: 20px;

      :deep(.el-alert) {
        padding: 16px;

        p {
          font-size: 13px;
        }
      }
    }
  }
}
</style>
