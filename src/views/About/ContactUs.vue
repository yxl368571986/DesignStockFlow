<template>
  <div class="contact-us-page">
    <div class="container mx-auto px-4 py-12">
      <div class="max-w-4xl mx-auto">
        <!-- 页面标题 -->
        <h1 class="text-4xl font-bold text-center mb-8 text-gray-800">联系我们</h1>
        
        <!-- 联系方式 -->
        <section class="mb-12">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div class="bg-white p-6 rounded-lg shadow-md text-center">
              <div class="text-blue-600 text-4xl mb-4">
                <i class="el-icon-message"></i>
              </div>
              <h3 class="text-xl font-semibold mb-2">邮箱联系</h3>
              <p class="text-gray-600">contact@xinchaodesign.com</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md text-center">
              <div class="text-blue-600 text-4xl mb-4">
                <i class="el-icon-phone"></i>
              </div>
              <h3 class="text-xl font-semibold mb-2">客服热线</h3>
              <p class="text-gray-600">400-888-8888</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md text-center">
              <div class="text-blue-600 text-4xl mb-4">
                <i class="el-icon-location"></i>
              </div>
              <h3 class="text-xl font-semibold mb-2">公司地址</h3>
              <p class="text-gray-600">中国·北京</p>
            </div>
          </div>
        </section>

        <!-- 在线留言表单 -->
        <section class="bg-white p-8 rounded-lg shadow-md">
          <h2 class="text-2xl font-semibold mb-6 text-gray-700">在线留言</h2>
          <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入您的姓名" />
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入您的邮箱" />
            </el-form-item>
            
            <el-form-item label="主题" prop="subject">
              <el-input v-model="form.subject" placeholder="请输入留言主题" />
            </el-form-item>
            
            <el-form-item label="留言内容" prop="message">
              <el-input
                v-model="form.message"
                type="textarea"
                :rows="6"
                placeholder="请输入您的留言内容"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="submitForm" :loading="loading">
                提交留言
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </section>

        <!-- 工作时间 -->
        <section class="mt-12">
          <div class="bg-blue-50 p-6 rounded-lg">
            <h3 class="text-xl font-semibold mb-4 text-gray-700">工作时间</h3>
            <p class="text-gray-600 mb-2">周一至周五：9:00 - 18:00</p>
            <p class="text-gray-600 mb-2">周六至周日：10:00 - 17:00</p>
            <p class="text-gray-600">法定节假日休息</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请输入主题', trigger: 'blur' }
  ],
  message: [
    { required: true, message: '请输入留言内容', trigger: 'blur' },
    { min: 10, message: '留言内容至少10个字符', trigger: 'blur' }
  ]
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      // 模拟提交
      setTimeout(() => {
        loading.value = false
        ElMessage.success('留言提交成功，我们会尽快回复您！')
        resetForm()
      }, 1000)
    }
  })
}

const resetForm = () => {
  if (!formRef.value) return
  formRef.value.resetFields()
}

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.contact-us-page {
  min-height: calc(100vh - 200px);
  background-color: #f9fafb;
}
</style>
