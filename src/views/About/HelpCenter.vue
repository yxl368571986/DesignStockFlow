<template>
  <div class="help-center-page">
    <div class="container mx-auto px-4 py-12">
      <div class="max-w-6xl mx-auto">
        <!-- 页面标题 -->
        <h1 class="text-4xl font-bold text-center mb-8 text-gray-800">帮助中心</h1>
        
        <!-- 搜索框 -->
        <div class="mb-12">
          <el-input
            v-model="searchQuery"
            placeholder="搜索您想了解的问题..."
            size="large"
            class="max-w-2xl mx-auto"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 常见问题分类 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div
            v-for="category in categories"
            :key="category.id"
            class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            @click="selectCategory(category.id)"
          >
            <div class="text-blue-600 text-3xl mb-4">
              <component :is="category.icon" />
            </div>
            <h3 class="text-xl font-semibold mb-2">{{ category.title }}</h3>
            <p class="text-gray-600">{{ category.description }}</p>
          </div>
        </div>

        <!-- 常见问题列表 -->
        <div class="bg-white rounded-lg shadow-md p-8">
          <h2 class="text-2xl font-semibold mb-6 text-gray-700">常见问题</h2>
          <el-collapse v-model="activeNames" accordion>
            <el-collapse-item
              v-for="faq in filteredFaqs"
              :key="faq.id"
              :name="faq.id"
            >
              <template #title>
                <span class="text-lg font-medium">{{ faq.question }}</span>
              </template>
              <div class="text-gray-600 leading-relaxed" v-html="faq.answer"></div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 联系客服 -->
        <div class="mt-12 bg-blue-50 p-8 rounded-lg text-center">
          <h3 class="text-2xl font-semibold mb-4 text-gray-700">没有找到答案？</h3>
          <p class="text-gray-600 mb-6">我们的客服团队随时为您提供帮助</p>
          <div class="flex justify-center gap-4">
            <el-button type="primary" size="large" @click="contactSupport">
              联系客服
            </el-button>
            <el-button size="large" @click="submitFeedback">
              提交反馈
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')
const activeNames = ref<string[]>([])
const selectedCategory = ref<string | null>(null)

// 分类
const categories = [
  {
    id: 'account',
    title: '账号相关',
    description: '注册、登录、密码找回等问题',
    icon: 'User'
  },
  {
    id: 'upload',
    title: '上传作品',
    description: '如何上传、审核流程等',
    icon: 'Upload'
  },
  {
    id: 'download',
    title: '下载资源',
    description: '下载方式、积分消耗等',
    icon: 'Download'
  },
  {
    id: 'vip',
    title: 'VIP会员',
    description: 'VIP特权、购买、续费等',
    icon: 'Crown'
  },
  {
    id: 'points',
    title: '积分系统',
    description: '积分获取、使用、兑换等',
    icon: 'Coin'
  },
  {
    id: 'other',
    title: '其他问题',
    description: '平台规则、投诉建议等',
    icon: 'QuestionFilled'
  }
]

// 常见问题
const faqs = [
  {
    id: '1',
    category: 'account',
    question: '如何注册账号？',
    answer: '点击页面右上角的"注册"按钮，输入手机号获取验证码，设置密码即可完成注册。'
  },
  {
    id: '2',
    category: 'account',
    question: '忘记密码怎么办？',
    answer: '在登录页面点击"忘记密码"，通过手机号验证码即可重置密码。'
  },
  {
    id: '3',
    category: 'upload',
    question: '如何上传作品？',
    answer: '登录后点击"上传作品"按钮，选择文件、填写作品信息、选择分类，提交后等待审核。审核通过后作品将在平台展示。'
  },
  {
    id: '4',
    category: 'upload',
    question: '作品审核需要多长时间？',
    answer: '一般情况下，作品会在1-3个工作日内完成审核。VIP用户享有优先审核权限，审核时间更短。'
  },
  {
    id: '5',
    category: 'download',
    question: '如何下载资源？',
    answer: '浏览资源详情页，点击"下载"按钮。普通用户需要消耗积分，VIP用户可免费下载所有资源。'
  },
  {
    id: '6',
    category: 'download',
    question: '下载需要消耗多少积分？',
    answer: '不同类型的资源消耗的积分不同：普通资源10积分，高级资源20积分，精品资源50积分。VIP用户下载不消耗积分。'
  },
  {
    id: '7',
    category: 'vip',
    question: 'VIP会员有哪些特权？',
    answer: 'VIP会员享有：免费下载所有资源、专属VIP资源访问、优先审核、去除下载限制、去除广告、专属客服、作品置顶推广、高速下载通道、批量下载、收藏夹扩展等特权。'
  },
  {
    id: '8',
    category: 'vip',
    question: '如何购买VIP？',
    answer: '访问VIP中心，选择合适的套餐（月卡/季卡/年卡），选择支付方式（微信/支付宝）完成支付即可开通。'
  },
  {
    id: '9',
    category: 'points',
    question: '如何获得积分？',
    answer: '您可以通过以下方式获得积分：上传作品审核通过(+50)、每日签到(+10)、作品被下载(+2)、作品被收藏(+5)、作品被点赞(+1)、完善个人资料(+20)、绑定邮箱(+10)、绑定微信(+10)、邀请新用户(+30)。'
  },
  {
    id: '10',
    category: 'points',
    question: '积分可以用来做什么？',
    answer: '积分可以用于：下载资源、兑换VIP会员、兑换下载次数包、兑换实物商品等。'
  },
  {
    id: '11',
    category: 'other',
    question: '如何投诉违规内容？',
    answer: '如发现违规内容，请点击资源页面的"举报"按钮，选择举报原因并提交。我们会在24小时内处理您的举报。'
  },
  {
    id: '12',
    category: 'other',
    question: '如何联系客服？',
    answer: '您可以通过以下方式联系我们：邮箱 contact@xinchaodesign.com，客服热线 400-888-8888（工作时间：周一至周五 9:00-18:00）。'
  }
]

// 筛选FAQ
const filteredFaqs = computed(() => {
  let result = faqs

  // 按分类筛选
  if (selectedCategory.value) {
    result = result.filter(faq => faq.category === selectedCategory.value)
  }

  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    )
  }

  return result
})

const selectCategory = (categoryId: string) => {
  selectedCategory.value = selectedCategory.value === categoryId ? null : categoryId
}

const contactSupport = () => {
  router.push('/about/contact')
}

const submitFeedback = () => {
  ElMessage.info('反馈功能即将上线，敬请期待！')
}

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.help-center-page {
  min-height: calc(100vh - 200px);
  background-color: #f9fafb;
}

:deep(.el-collapse-item__header) {
  font-size: 16px;
  padding: 16px 0;
}

:deep(.el-collapse-item__content) {
  padding: 16px 0;
}
</style>
