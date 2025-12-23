<!--
  MobileLayout 移动端布局组件演示
  
  说明：
  - 本演示文件展示移动端布局的各种功能
  - 在移动设备或浏览器开发者工具的移动模式下查看效果最佳
-->

<script setup lang="ts">
import { ref } from 'vue';
import MobileLayout from './MobileLayout.vue';

// 演示状态
const demoContent = ref('home');

// 模拟页面内容
const pages = {
  home: {
    title: '首页',
    content: '这是首页内容。向下滚动查看更多内容。'
  },
  category: {
    title: '分类',
    content: '这是分类页面。浏览各种设计资源分类。'
  },
  upload: {
    title: '上传',
    content: '这是上传页面。上传您的设计作品。'
  },
  personal: {
    title: '个人中心',
    content: '这是个人中心。管理您的账户和资源。'
  }
};

const currentPage = ref(pages.home);

function changePage(page: keyof typeof pages) {
  currentPage.value = pages[page];
  demoContent.value = page;
}
</script>

<template>
  <div class="demo-container">
    <!-- 演示说明 -->
    <div class="demo-info">
      <h2>MobileLayout 移动端布局演示</h2>
      <p>请在移动设备或浏览器开发者工具的移动模式下查看效果</p>

      <div class="demo-features">
        <h3>功能演示：</h3>
        <ul>
          <li>✅ 点击左上角菜单按钮打开侧边抽屉</li>
          <li>✅ 点击右上角搜索按钮打开全屏搜索</li>
          <li>✅ 点击底部Tab栏切换页面</li>
          <li>✅ 从屏幕左边缘向右滑动返回</li>
          <li>✅ 查看用户信息和分类列表</li>
        </ul>
      </div>

      <div class="demo-controls">
        <h3>快速切换页面：</h3>
        <div class="button-group">
          <button
            :class="{ active: demoContent === 'home' }"
            @click="changePage('home')"
          >
            首页
          </button>
          <button
            :class="{ active: demoContent === 'category' }"
            @click="changePage('category')"
          >
            分类
          </button>
          <button
            :class="{ active: demoContent === 'upload' }"
            @click="changePage('upload')"
          >
            上传
          </button>
          <button
            :class="{ active: demoContent === 'personal' }"
            @click="changePage('personal')"
          >
            个人中心
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端布局演示 -->
    <div class="demo-mobile">
      <div class="mobile-frame">
        <div class="mobile-notch" />
        <div class="mobile-screen">
          <MobileLayout>
            <!-- 模拟页面内容 -->
            <div class="demo-page">
              <h1>{{ currentPage.title }}</h1>
              <p>{{ currentPage.content }}</p>

              <!-- 模拟内容卡片 -->
              <div class="demo-cards">
                <div
                  v-for="i in 10"
                  :key="i"
                  class="demo-card"
                >
                  <div class="card-image" />
                  <div class="card-content">
                    <h3>资源标题 {{ i }}</h3>
                    <p>这是资源描述文本...</p>
                    <div class="card-meta">
                      <span>👁️ 1.2k</span>
                      <span>⬇️ 856</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MobileLayout>
        </div>
        <div class="mobile-home-indicator" />
      </div>
    </div>

    <!-- 技术说明 -->
    <div class="demo-tech">
      <h3>技术特性：</h3>
      <div class="tech-grid">
        <div class="tech-item">
          <h4>🎨 响应式设计</h4>
          <p>自动适配不同屏幕尺寸</p>
        </div>
        <div class="tech-item">
          <h4>👆 手势操作</h4>
          <p>支持滑动返回等手势</p>
        </div>
        <div class="tech-item">
          <h4>📱 安全区域</h4>
          <p>适配刘海屏和底部横条</p>
        </div>
        <div class="tech-item">
          <h4>🌙 暗色模式</h4>
          <p>自动适配系统主题</p>
        </div>
        <div class="tech-item">
          <h4>⚡ 性能优化</h4>
          <p>流畅的动画和交互</p>
        </div>
        <div class="tech-item">
          <h4>♿ 可访问性</h4>
          <p>ARIA标签和键盘导航</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 演示说明 */
.demo-info {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.demo-info h2 {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #165dff 0%, #ff7d00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.demo-info > p {
  font-size: 16px;
  color: #606266;
  margin: 0 0 24px 0;
}

.demo-features {
  margin-bottom: 24px;
}

.demo-features h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.demo-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-features li {
  font-size: 15px;
  color: #606266;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

/* 控制按钮 */
.demo-controls {
  margin-top: 24px;
}

.demo-controls h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.button-group button {
  padding: 10px 20px;
  border: 2px solid #e4e7ed;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-group button:hover {
  border-color: #165dff;
  color: #165dff;
}

.button-group button.active {
  border-color: #165dff;
  background: #165dff;
  color: #fff;
}

/* 移动端框架 */
.demo-mobile {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.mobile-frame {
  width: 375px;
  height: 812px;
  background: #000;
  border-radius: 40px;
  padding: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.mobile-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 30px;
  background: #000;
  border-radius: 0 0 20px 20px;
  z-index: 10;
}

.mobile-screen {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 32px;
  overflow: hidden;
  position: relative;
}

.mobile-home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 134px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

/* 演示页面内容 */
.demo-page {
  padding: 16px;
}

.demo-page h1 {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 12px 0;
}

.demo-page > p {
  font-size: 14px;
  color: #606266;
  margin: 0 0 24px 0;
}

.demo-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-image {
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-content {
  padding: 16px;
}

.card-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.card-content p {
  font-size: 14px;
  color: #909399;
  margin: 0 0 12px 0;
}

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

/* 技术说明 */
.demo-tech {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.demo-tech h3 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px 0;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.tech-item {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.tech-item:hover {
  background: #e4e7ed;
  transform: translateY(-2px);
}

.tech-item h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.tech-item p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .mobile-frame {
    width: 100%;
    max-width: 375px;
    height: auto;
    aspect-ratio: 375 / 812;
  }

  .tech-grid {
    grid-template-columns: 1fr;
  }
}
</style>
