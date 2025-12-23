<template>
  <div class="about-us-page">
    <div class="container mx-auto px-4 py-12">
      <div class="max-w-4xl mx-auto">
        <!-- 页面标题 -->
        <h1 class="text-4xl font-bold text-center mb-8 text-gray-800">关于我们</h1>
        
        <!-- 公司简介 -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">公司简介</h2>
          <div class="prose prose-lg text-gray-600">
            <p class="mb-4">
              星潮设计是一个专业的设计资源分享平台，致力于为设计师和创意工作者提供高质量的设计素材和资源。
              我们汇聚了海量的设计作品，涵盖党建类、节日海报、电商设计、UI设计等多个领域。
            </p>
            <p class="mb-4">
              自成立以来，我们始终坚持"分享创意，传递价值"的理念，为用户提供便捷、高效的资源获取服务。
              平台拥有完善的审核机制，确保每一份资源都具有高质量和实用性。
            </p>
          </div>
        </section>

        <!-- 我们的使命 -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">我们的使命</h2>
          <div class="prose prose-lg text-gray-600">
            <p class="mb-4">
              让每一位设计师都能轻松获取优质的设计资源，激发创意灵感，提升工作效率。
              我们相信，通过资源共享和知识传递，可以推动整个设计行业的发展和进步。
            </p>
          </div>
        </section>

        <!-- 核心价值观 -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">核心价值观</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 class="text-xl font-semibold mb-2 text-blue-600">专业</h3>
              <p class="text-gray-600">严格的审核标准，确保每一份资源都具有专业水准</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 class="text-xl font-semibold mb-2 text-blue-600">共享</h3>
              <p class="text-gray-600">鼓励设计师分享作品，共同构建设计资源生态</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 class="text-xl font-semibold mb-2 text-blue-600">创新</h3>
              <p class="text-gray-600">持续优化平台功能，提供更好的用户体验</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 class="text-xl font-semibold mb-2 text-blue-600">服务</h3>
              <p class="text-gray-600">以用户为中心，提供优质的客户服务</p>
            </div>
          </div>
        </section>

        <!-- 联系方式 -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold mb-4 text-gray-700">联系我们</h2>
          <div class="bg-blue-50 p-6 rounded-lg">
            <p class="text-gray-600 mb-2">
              <span class="font-semibold">邮箱：</span>contact@xinchaodesign.com
            </p>
            <p class="text-gray-600 mb-2">
              <span class="font-semibold">客服时间：</span>周一至周五 9:00-18:00
            </p>
            <p class="text-gray-600">
              <span class="font-semibold">地址：</span>中国·北京
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // 页面加载时滚动到顶部
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.about-us-page {
  min-height: calc(100vh - 200px);
  background-color: #f9fafb;
}

.prose p {
  line-height: 1.8;
}
</style>
