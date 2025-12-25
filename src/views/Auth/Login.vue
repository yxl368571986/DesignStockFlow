<!--
  登录页面
  功能：
  - 手机号输入框（验证格式）
  - 密码输入框（显示/隐藏密码）
  - 记住我复选框
  - 登录按钮（loading状态）
  - 忘记密码链接
  - 注册链接
  - 使用useAuth组合式函数
  - 表单验证（Element Plus Form）
-->

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Logo和标题 -->
      <div class="login-header">
        <div class="logo">
          <span class="logo-text">星潮设计</span>
        </div>
        <h2 class="login-title">
          欢迎登录
        </h2>
        <p class="login-subtitle">
          登录后享受更多设计资源
        </p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <!-- 手机号输入框 -->
        <el-form-item prop="phone">
          <el-input
            v-model="loginForm.phone"
            name="phone"
            placeholder="请输入手机号"
            size="large"
            clearable
            maxlength="11"
          >
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="passwordPlaceholder"
            size="large"
            clearable
            maxlength="20"
            @focus="passwordPlaceholder = '请输入密码'"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
            <template #suffix>
              <el-icon
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <View v-if="!showPassword" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 记住我和忘记密码 -->
        <div class="login-options">
          <el-checkbox
            v-model="loginForm.rememberMe"
            size="large"
          >
            记住我
          </el-checkbox>
          <router-link
            to="/forgot-password"
            class="forgot-link"
          >
            忘记密码？
          </router-link>
        </div>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            native-type="submit"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <!-- 注册链接 -->
        <div class="register-link">
          还没有账号？
          <router-link
            :to="redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'"
            class="link"
          >
            立即注册
          </router-link>
        </div>
      </el-form>

      <!-- 第三方登录（可选） -->
      <div class="third-party-login">
        <div class="divider">
          <span>其他登录方式</span>
        </div>
        <div class="third-party-buttons">
          <el-button
            circle
            size="large"
            title="微信登录"
          >
            <el-icon><ChatDotRound /></el-icon>
          </el-button>
          <el-button
            circle
            size="large"
            title="QQ登录"
          >
            <el-icon><User /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { Phone, Lock, View, Hide, ChatDotRound, User } from '@element-plus/icons-vue';
import { useAuth } from '@/composables/useAuth';
import { validatePhone } from '@/utils/validate';

// ========== 路由 ==========
const route = useRoute();
const router = useRouter();

// ========== 认证逻辑 ==========
const { loading, login } = useAuth();

// ========== 表单引用 ==========
const loginFormRef = ref<FormInstance>();

// ========== 重定向地址 ==========
const redirectUrl = ref<string>('');

// ========== 表单数据 ==========
const loginForm = reactive({
  phone: '',
  password: '',
  rememberMe: false
});

// ========== 密码显示/隐藏 ==========
const showPassword = ref(false);

// ========== 密码输入框placeholder ==========
const passwordPlaceholder = ref('请输入密码');

// ========== 表单验证规则 ==========
const loginRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入手机号'));
        } else if (!validatePhone(value)) {
          callback(new Error('请输入正确的手机号格式'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
    { max: 20, message: '密码最多20位', trigger: 'blur' }
  ]
};

// ========== 登录处理 ==========
/**
 * 处理登录
 */
async function handleLogin() {
  if (!loginFormRef.value) return;

  try {
    // 验证表单
    await loginFormRef.value.validate();

    // 调用登录方法（不自动跳转，由本组件处理）
    const result = await login(loginForm.phone, loginForm.password, loginForm.rememberMe, false);

    // 登录成功后处理跳转
    if (result.success) {
      console.log('登录成功，准备跳转');
      // 如果有重定向地址，跳转到该地址；否则跳转到首页
      if (redirectUrl.value) {
        await router.push(redirectUrl.value);
      } else {
        await router.push('/');
      }
    } else {
      // 根据错误码处理不同情况
      handleLoginError(result.errorCode);
    }
  } catch (error) {
    // 表单验证失败
    console.error('表单验证失败:', error);
  }
}

/**
 * 处理登录错误
 * @param errorCode 错误码
 */
function handleLoginError(errorCode?: string) {
  if (errorCode === 'ACCOUNT_NOT_FOUND') {
    // 账号不存在：清空账号和密码输入框
    loginForm.phone = '';
    loginForm.password = '';
    // 重置表单验证状态
    loginFormRef.value?.clearValidate();
  } else if (errorCode === 'PASSWORD_INCORRECT') {
    // 密码错误：保留账号，清空密码，设置密码框placeholder提示
    loginForm.password = '';
    passwordPlaceholder.value = '密码错误，请重新输入';
    // 只清除密码字段的验证状态
    loginFormRef.value?.clearValidate('password');
  } else {
    // 其他错误：清空所有输入
    loginForm.phone = '';
    loginForm.password = '';
    loginFormRef.value?.clearValidate();
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  // 获取重定向地址
  const redirect = route.query.redirect as string;
  if (redirect) {
    redirectUrl.value = decodeURIComponent(redirect);
    console.log('登录后将跳转到:', redirectUrl.value);
  }
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

/* Logo和标题 */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  margin-bottom: 16px;
}

.logo-text {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(135deg, #165dff 0%, #ff7d00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 14px;
  color: #86909c;
  margin: 0;
}

/* 表单 */
.login-form {
  margin-top: 32px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
}

.login-form :deep(.el-input__inner) {
  font-size: 14px;
  line-height: 40px;
}

/* 密码显示/隐藏图标 */
.password-toggle {
  cursor: pointer;
  color: #86909c;
  transition: color 0.3s;
}

.password-toggle:hover {
  color: #165dff;
}

/* 记住我和忘记密码 */
.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.forgot-link {
  font-size: 14px;
  color: #165dff;
  text-decoration: none;
  transition: color 0.3s;
}

.forgot-link:hover {
  color: #4080ff;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  height: 40px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  border: none;
  transition: all 0.3s;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

/* 注册链接 */
.register-link {
  text-align: center;
  font-size: 14px;
  color: #86909c;
  margin-top: 12px;
}

.register-link .link {
  color: #165dff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.register-link .link:hover {
  color: #4080ff;
}

/* 第三方登录 */
.third-party-login {
  margin-top: 24px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin-bottom: 16px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e6eb;
}

.divider span {
  padding: 0 16px;
  font-size: 14px;
  color: #86909c;
}

.third-party-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.third-party-buttons .el-button {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e6eb;
  color: #4e5969;
  transition: all 0.3s;
}

.third-party-buttons .el-button:hover {
  border-color: #165dff;
  color: #165dff;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 32px 24px;
  }

  .logo-text {
    font-size: 28px;
  }

  .login-title {
    font-size: 20px;
  }
}
</style>
