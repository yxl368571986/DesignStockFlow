<!--
  注册页面
  功能：
  - 手机号输入框（验证格式）
  - 验证码输入框（60秒倒计时）
  - 密码输入框（强度提示）
  - 确认密码输入框（一致性验证）
  - 注册按钮（loading状态）
  - 已有账号登录链接
  - 使用useAuth组合式函数
-->

<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Logo和标题 -->
      <div class="register-header">
        <div class="logo">
          <span class="logo-text">星潮设计</span>
        </div>
        <h2 class="register-title">
          欢迎注册
        </h2>
        <p class="register-subtitle">
          注册后即可下载海量设计资源
        </p>
      </div>

      <!-- 注册表单 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <!-- 手机号输入框 -->
        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
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

        <!-- 验证码输入框 -->
        <el-form-item prop="verifyCode">
          <div class="verify-code-wrapper">
            <el-input
              v-model="registerForm.verifyCode"
              name="verifyCode"
              placeholder="请输入验证码"
              size="large"
              clearable
              maxlength="6"
              class="verify-code-input"
            >
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
            <el-button
              size="large"
              :disabled="countdown > 0 || sendingCode"
              :loading="sendingCode"
              class="send-code-button"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码（至少6位）"
            size="large"
            clearable
            maxlength="20"
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
          <!-- 密码强度提示 -->
          <div
            v-if="registerForm.password"
            class="password-strength"
          >
            <span class="strength-label">密码强度：</span>
            <span
              class="strength-indicator"
              :class="`strength-${passwordStrength}`"
            >
              {{ passwordStrengthText }}
            </span>
          </div>
        </el-form-item>

        <!-- 确认密码输入框 -->
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            name="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="请再次输入密码"
            size="large"
            clearable
            maxlength="20"
            @keyup.enter="handleRegister"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
            <template #suffix>
              <el-icon
                class="password-toggle"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <View v-if="!showConfirmPassword" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 注册按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="register-button"
            native-type="submit"
            @click="handleRegister"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>

        <!-- 登录链接 -->
        <div class="login-link">
          已有账号？
          <router-link
            :to="redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'"
            class="link"
          >
            立即登录
          </router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { Phone, Message, Lock, View, Hide } from '@element-plus/icons-vue';
import { useAuth } from '@/composables/useAuth';
import { validatePhone, validatePassword, validateVerifyCode } from '@/utils/validate';

// ========== 路由 ==========
const route = useRoute();
const router = useRouter();

// ========== 认证逻辑 ==========
const { loading, countdown, sendingCode, register, sendCode } = useAuth();

// ========== 表单引用 ==========
const registerFormRef = ref<FormInstance>();

// ========== 重定向地址 ==========
const redirectUrl = ref<string>('');

// ========== 表单数据 ==========
const registerForm = reactive({
  phone: '',
  verifyCode: '',
  password: '',
  confirmPassword: ''
});

// ========== 密码显示/隐藏 ==========
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// ========== 密码强度计算 ==========
const passwordStrength = computed(() => {
  if (!registerForm.password) return '';
  const result = validatePassword(registerForm.password);
  return result.strength || 'weak';
});

const passwordStrengthText = computed(() => {
  const strengthMap = {
    weak: '弱',
    medium: '中',
    strong: '强'
  };
  return strengthMap[passwordStrength.value as keyof typeof strengthMap] || '';
});

// ========== 表单验证规则 ==========
const registerRules: FormRules = {
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
  verifyCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入验证码'));
        } else if (!validateVerifyCode(value)) {
          callback(new Error('请输入6位数字验证码'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入密码'));
        } else {
          const result = validatePassword(value);
          if (!result.valid) {
            callback(new Error(result.message || '密码格式不正确'));
          } else {
            // 如果确认密码已输入，重新验证确认密码
            if (registerForm.confirmPassword) {
              registerFormRef.value?.validateField('confirmPassword');
            }
            callback();
          }
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请再次输入密码'));
        } else if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// ========== 发送验证码 ==========
/**
 * 处理发送验证码
 */
async function handleSendCode() {
  // 先验证手机号
  if (!registerFormRef.value) return;

  try {
    await registerFormRef.value.validateField('phone');

    // 调用发送验证码方法
    await sendCode(registerForm.phone, 'register');
  } catch (error) {
    // 手机号验证失败
    console.error('手机号验证失败:', error);
  }
}

// ========== 注册处理 ==========
/**
 * 处理注册
 */
async function handleRegister() {
  if (!registerFormRef.value) return;

  try {
    // 验证表单
    await registerFormRef.value.validate();

    // 调用注册方法（不自动跳转，由本组件处理）
    const result = await register(
      registerForm.phone,
      registerForm.verifyCode,
      registerForm.password,
      registerForm.confirmPassword,
      false
    );

    // 注册成功后处理跳转
    if (result.success) {
      console.log('注册成功，准备跳转');
      // 如果有重定向地址，跳转到该地址；否则跳转到首页
      if (redirectUrl.value) {
        await router.push(redirectUrl.value);
      } else {
        await router.push('/');
      }
    }
  } catch (error) {
    // 表单验证失败
    console.error('表单验证失败:', error);
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  // 获取重定向地址
  const redirect = route.query.redirect as string;
  if (redirect) {
    redirectUrl.value = decodeURIComponent(redirect);
    console.log('注册后将跳转到:', redirectUrl.value);
  }
});
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

/* Logo和标题 */
.register-header {
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

.register-title {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px 0;
}

.register-subtitle {
  font-size: 14px;
  color: #86909c;
  margin: 0;
}

/* 表单 */
.register-form {
  margin-top: 32px;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.register-form :deep(.el-input__wrapper) {
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
}

.register-form :deep(.el-input__inner) {
  font-size: 14px;
  line-height: 40px;
}

/* 验证码输入框 */
.verify-code-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
}

.verify-code-input {
  flex: 1;
}

.send-code-button {
  flex-shrink: 0;
  width: 120px;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
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

/* 密码强度提示 */
.password-strength {
  margin-top: 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.strength-label {
  color: #86909c;
  margin-right: 8px;
}

.strength-indicator {
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.strength-weak {
  color: #f53f3f;
  background-color: #ffece8;
}

.strength-medium {
  color: #ff7d00;
  background-color: #fff7e8;
}

.strength-strong {
  color: #00b42a;
  background-color: #e8ffea;
}

/* 注册按钮 */
.register-button {
  width: 100%;
  height: 40px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  border: none;
  transition: all 0.3s;
}

.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.4);
}

.register-button:active {
  transform: translateY(0);
}

/* 登录链接 */
.login-link {
  text-align: center;
  font-size: 14px;
  color: #86909c;
  margin-top: 12px;
}

.login-link .link {
  color: #165dff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.login-link .link:hover {
  color: #4080ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-container {
    padding: 32px 24px;
  }

  .logo-text {
    font-size: 28px;
  }

  .register-title {
    font-size: 20px;
  }

  .send-code-button {
    width: 110px;
    font-size: 13px;
  }
}
</style>
