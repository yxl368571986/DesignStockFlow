<!--
  DownloadButton 组件演示
  
  展示下载按钮组件的各种用法和样式
-->

<script setup lang="ts">
import { ref } from 'vue';
import DownloadButton from './DownloadButton.vue';
import { ElMessage } from 'element-plus';

// 模拟资源数据
const normalResource = ref({
  resourceId: 'res_normal_001',
  title: '普通资源',
  vipLevel: 0
});

const vipResource = ref({
  resourceId: 'res_vip_001',
  title: 'VIP专属资源',
  vipLevel: 1
});

// 事件处理
function handleSuccess(resourceId: string) {
  console.log('下载成功:', resourceId);
  ElMessage.success(`资源 ${resourceId} 下载成功！`);
}

function handleError(error: string) {
  console.error('下载失败:', error);
  ElMessage.error(`下载失败: ${error}`);
}
</script>

<template>
  <div class="demo-container">
    <h2>DownloadButton 下载按钮组件演示</h2>

    <!-- 基础用法 -->
    <section class="demo-section">
      <h3>基础用法</h3>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">
            普通下载按钮
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="下载资源"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            VIP下载按钮
          </p>
          <DownloadButton
            :resource-id="vipResource.resourceId"
            :vip-level="1"
            text="VIP下载"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            仅图标按钮
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>
      </div>
    </section>

    <!-- 按钮样式 -->
    <section class="demo-section">
      <h3>按钮样式</h3>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">
            圆形按钮
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            circle
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            圆角按钮
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="立即下载"
            round
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            朴素按钮
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="下载"
            plain
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            VIP朴素按钮
          </p>
          <DownloadButton
            :resource-id="vipResource.resourceId"
            :vip-level="1"
            text="VIP下载"
            plain
            @success="handleSuccess"
            @error="handleError"
          />
        </div>
      </div>
    </section>

    <!-- 按钮尺寸 -->
    <section class="demo-section">
      <h3>按钮尺寸</h3>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">
            大按钮
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="大按钮"
            size="large"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            默认按钮
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="默认按钮"
            size="default"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            小按钮
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="小按钮"
            size="small"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>
      </div>
    </section>

    <!-- 按钮类型 -->
    <section class="demo-section">
      <h3>按钮类型</h3>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">
            Primary
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="下载"
            type="primary"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            Success
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="下载"
            type="success"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            Info
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="下载"
            type="info"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            Warning (VIP自动)
          </p>
          <DownloadButton
            :resource-id="vipResource.resourceId"
            :vip-level="1"
            text="VIP下载"
            @success="handleSuccess"
            @error="handleError"
          />
        </div>
      </div>
    </section>

    <!-- 禁用状态 -->
    <section class="demo-section">
      <h3>禁用状态</h3>
      <div class="demo-row">
        <div class="demo-item">
          <p class="demo-label">
            禁用按钮
          </p>
          <DownloadButton
            :resource-id="normalResource.resourceId"
            text="已禁用"
            disabled
          />
        </div>

        <div class="demo-item">
          <p class="demo-label">
            禁用VIP按钮
          </p>
          <DownloadButton
            :resource-id="vipResource.resourceId"
            :vip-level="1"
            text="已禁用"
            disabled
          />
        </div>
      </div>
    </section>

    <!-- 实际场景 -->
    <section class="demo-section">
      <h3>实际使用场景</h3>

      <!-- 资源卡片场景 -->
      <div class="demo-card">
        <h4>资源卡片场景</h4>
        <div class="resource-card-demo">
          <div class="card-cover">
            <img
              src="https://via.placeholder.com/300x200"
              alt="资源封面"
            >
            <div class="card-actions">
              <DownloadButton
                :resource-id="normalResource.resourceId"
                circle
                @success="handleSuccess"
                @error="handleError"
              />
            </div>
          </div>
          <div class="card-info">
            <h3>{{ normalResource.title }}</h3>
            <p>这是一个普通资源的示例</p>
          </div>
        </div>
      </div>

      <!-- 资源详情场景 -->
      <div class="demo-card">
        <h4>资源详情场景</h4>
        <div class="resource-detail-demo">
          <div class="detail-header">
            <div class="detail-info">
              <h2>{{ vipResource.title }}</h2>
              <p>这是一个VIP专属资源</p>
            </div>
            <DownloadButton
              :resource-id="vipResource.resourceId"
              :vip-level="1"
              text="立即下载"
              size="large"
              round
              @success="handleSuccess"
              @error="handleError"
            />
          </div>
        </div>
      </div>

      <!-- 列表场景 -->
      <div class="demo-card">
        <h4>资源列表场景</h4>
        <div class="resource-list-demo">
          <div class="list-item">
            <div class="item-info">
              <h3>设计资源 1</h3>
              <span class="item-meta">PSD · 15MB · 1.2k下载</span>
            </div>
            <DownloadButton
              resource-id="res_001"
              text="下载"
              size="small"
              round
              @success="handleSuccess"
              @error="handleError"
            />
          </div>
          <div class="list-item">
            <div class="item-info">
              <h3>VIP设计资源 2</h3>
              <span class="item-meta">AI · 25MB · 2.5k下载</span>
            </div>
            <DownloadButton
              resource-id="res_002"
              :vip-level="1"
              text="VIP下载"
              size="small"
              round
              @success="handleSuccess"
              @error="handleError"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 使用说明 -->
    <section class="demo-section">
      <h3>使用说明</h3>
      <div class="demo-tips">
        <el-alert
          title="权限处理"
          type="info"
          :closable="false"
          show-icon
        >
          <ul>
            <li>未登录用户点击按钮会弹出登录确认对话框</li>
            <li>非VIP用户下载VIP资源会弹出VIP升级提示</li>
            <li>有权限的用户点击按钮会直接触发下载</li>
            <li>下载中时按钮会显示loading状态并禁用点击</li>
          </ul>
        </el-alert>

        <el-alert
          title="样式说明"
          type="success"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        >
          <ul>
            <li>VIP资源按钮自动应用橙色渐变样式</li>
            <li>支持多种按钮样式：圆形、圆角、朴素等</li>
            <li>支持三种尺寸：large、default、small</li>
            <li>响应式设计，移动端自动适配</li>
          </ul>
        </el-alert>
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-container h2 {
  margin-bottom: 32px;
  font-size: 28px;
  color: #303133;
  border-bottom: 2px solid #165dff;
  padding-bottom: 12px;
}

.demo-section {
  margin-bottom: 48px;
}

.demo-section h3 {
  margin-bottom: 20px;
  font-size: 20px;
  color: #606266;
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 16px;
}

.demo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  min-width: 150px;
}

.demo-label {
  margin: 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

.demo-card {
  margin-bottom: 24px;
  padding: 20px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
}

.demo-card h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #606266;
}

/* 资源卡片演示 */
.resource-card-demo {
  max-width: 300px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-cover {
  position: relative;
  width: 100%;
  padding-top: 66.67%;
  overflow: hidden;
}

.card-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.resource-card-demo:hover .card-actions {
  opacity: 1;
}

.resource-card-demo:hover .card-cover::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
}

.card-info {
  padding: 12px;
}

.card-info h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.card-info p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

/* 资源详情演示 */
.resource-detail-demo {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.detail-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.detail-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

/* 资源列表演示 */
.resource-list-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.item-info h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.item-meta {
  font-size: 12px;
  color: #909399;
}

/* 使用说明 */
.demo-tips ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.demo-tips li {
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.6;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .demo-container {
    padding: 16px;
  }

  .demo-row {
    flex-direction: column;
  }

  .demo-item {
    width: 100%;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .demo-container h2 {
    color: #e5eaf3;
    border-bottom-color: #165dff;
  }

  .demo-section h3 {
    color: #c0c4cc;
  }

  .demo-item {
    background: #2b2b2b;
  }

  .demo-label {
    color: #a8abb2;
  }

  .demo-card {
    background: #1d1e1f;
    border-color: #4c4d4f;
  }

  .demo-card h4 {
    color: #c0c4cc;
  }

  .resource-card-demo {
    background: #1d1e1f;
  }

  .card-info h3 {
    color: #e5eaf3;
  }

  .card-info p {
    color: #a8abb2;
  }

  .resource-detail-demo {
    background: #2b2b2b;
  }

  .detail-info h2 {
    color: #e5eaf3;
  }

  .detail-info p {
    color: #c0c4cc;
  }

  .list-item {
    background: #2b2b2b;
  }

  .item-info h3 {
    color: #e5eaf3;
  }

  .item-meta {
    color: #a8abb2;
  }
}
</style>
