<template>
  <div class="vip-page">
    <div class="vip-container">
      <h1 class="vip-title">VIP会员中心</h1>
      <p class="vip-subtitle">升级VIP，享受更多特权</p>

      <div class="vip-plans">
        <div class="vip-plan">
          <h3>月度会员</h3>
          <div class="price">¥29<span>/月</span></div>
          <ul class="features">
            <li>✓ 无限下载资源</li>
            <li>✓ 专属VIP标识</li>
            <li>✓ 优先客服支持</li>
          </ul>
          <el-button type="primary" size="large">立即开通</el-button>
        </div>

        <div class="vip-plan featured">
          <div class="badge">推荐</div>
          <h3>年度会员</h3>
          <div class="price">¥199<span>/年</span></div>
          <ul class="features">
            <li>✓ 无限下载资源</li>
            <li>✓ 专属VIP标识</li>
            <li>✓ 优先客服支持</li>
            <li>✓ 专属设计素材</li>
          </ul>
          <el-button type="primary" size="large">立即开通</el-button>
        </div>

        <div class="vip-plan">
          <h3>终身会员</h3>
          <div class="price">¥599<span>/终身</span></div>
          <ul class="features">
            <li>✓ 无限下载资源</li>
            <li>✓ 专属VIP标识</li>
            <li>✓ 优先客服支持</li>
            <li>✓ 专属设计素材</li>
            <li>✓ 终身免费更新</li>
          </ul>
          <el-button type="primary" size="large">立即开通</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * VIP中心页面
 */
</script>

<style scoped>
.vip-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px;
}

.vip-container {
  max-width: 1200px;
  margin: 0 auto;
}

.vip-title {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin-bottom: 16px;
}

.vip-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin-bottom: 60px;
}

.vip-plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1000px;
  margin: 0 auto;
}

.vip-plan {
  background: #fff;
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.vip-plan:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.vip-plan.featured {
  border: 3px solid #667eea;
  transform: scale(1.05);
}

.vip-plan.featured:hover {
  transform: scale(1.05) translateY(-8px);
}

.badge {
  position: absolute;
  top: -12px;
  right: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.vip-plan h3 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

.price {
  font-size: 48px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 30px;
}

.price span {
  font-size: 18px;
  color: #999;
  font-weight: normal;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
  text-align: left;
}

.features li {
  padding: 12px 0;
  color: #666;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.features li:last-child {
  border-bottom: none;
}

.vip-plan .el-button {
  width: 100%;
}

@media (max-width: 768px) {
  .vip-title {
    font-size: 32px;
  }

  .vip-subtitle {
    font-size: 16px;
  }

  .vip-plans {
    grid-template-columns: 1fr;
  }

  .vip-plan.featured {
    transform: scale(1);
  }

  .vip-plan.featured:hover {
    transform: translateY(-8px);
  }
}
</style>
