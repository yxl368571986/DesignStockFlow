/**
 * 认证组合式函数
 * 提供登录、注册、退出、发送验证码等认证相关功能
 */

import { ref, readonly } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/pinia/userStore';
import {
  login as loginAPI,
  register as registerAPI,
  sendVerifyCode as sendVerifyCodeAPI,
  logout as logoutAPI
} from '@/api/auth';
import { encryptPassword } from '@/utils/security';
import { validatePhone, validatePassword, validateVerifyCode } from '@/utils/validate';
import type { LoginRequest, RegisterRequest, VerifyCodeRequest } from '@/types/models';

/**
 * 认证组合式函数
 */
export function useAuth() {
  const router = useRouter();
  const userStore = useUserStore();

  // ========== 状态 ==========

  /**
   * 加载状态
   */
  const loading = ref(false);

  /**
   * 错误信息
   */
  const error = ref<string | null>(null);

  /**
   * 验证码倒计时（秒）
   */
  const countdown = ref(0);

  /**
   * 是否正在发送验证码
   */
  const sendingCode = ref(false);

  // ========== 方法 ==========

  /**
   * 用户登录
   * @param phone 手机号
   * @param password 密码
   * @param rememberMe 是否记住我
   * @param autoRedirect 是否自动跳转到首页（默认true）
   * @returns Promise<{ success: boolean, error?: string, errorCode?: string }>
   */
  async function login(
    phone: string,
    password: string,
    rememberMe: boolean = false,
    autoRedirect: boolean = true
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    // 重置错误状态
    error.value = null;

    // 验证手机号
    if (!validatePhone(phone)) {
      error.value = '请输入正确的手机号';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }

    // 验证密码
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      error.value = passwordValidation.message || '密码格式不正确';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }

    loading.value = true;

    try {
      // 注意：密码不在前端加密，直接发送给后端
      // 后端使用 bcrypt 进行密码验证
      // 传输安全由 HTTPS 保证

      // 构造登录请求
      const loginRequest: LoginRequest = {
        phone,
        password, // 直接使用明文密码
        rememberMe
      };

      // 调用登录API
      const response = await loginAPI(loginRequest);

      // 检查响应
      if (response.code === 200 && response.data) {
        // 更新用户状态
        // 如果后端返回了过期时间，使用后端的；否则使用默认值
        const expireTime = response.data.expireTime
          ? new Date(response.data.expireTime).getTime()
          : undefined;

        userStore.setToken(response.data.token, rememberMe, expireTime);
        userStore.setUserInfo(response.data.userInfo);

        // 显示成功提示
        ElMessage.success('登录成功');

        // 根据参数决定是否自动跳转
        if (autoRedirect) {
          await router.push('/');
        }

        return { success: true };
      } else {
        error.value = response.msg || '登录失败';
        const errorCode = (response as { errorCode?: string }).errorCode;
        ElMessage.error(error.value);
        return { success: false, error: error.value, errorCode };
      }
    } catch (e) {
      // 从axios错误响应中提取errorCode
      const axiosError = e as { response?: { data?: { msg?: string; errorCode?: string } } };
      const errorMsg = axiosError.response?.data?.msg || (e as Error).message || '登录失败，请稍后重试';
      const errorCode = axiosError.response?.data?.errorCode;
      error.value = errorMsg;
      ElMessage.error(error.value);
      return { success: false, error: error.value, errorCode };
    } finally {
      loading.value = false;
    }
  }

  /**
   * 用户注册
   * @param phone 手机号
   * @param verifyCode 验证码
   * @param password 密码
   * @param confirmPassword 确认密码
   * @param autoRedirect 是否自动跳转到首页（默认true）
   * @returns Promise<{ success: boolean, error?: string }>
   */
  async function register(
    phone: string,
    verifyCode: string,
    password: string,
    confirmPassword: string,
    autoRedirect: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    // 重置错误状态
    error.value = null;

    // 验证手机号
    if (!validatePhone(phone)) {
      error.value = '请输入正确的手机号';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }

    // 验证验证码
    if (!validateVerifyCode(verifyCode)) {
      error.value = '请输入6位数字验证码';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }

    // 验证密码
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      error.value = passwordValidation.message || '密码格式不正确';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }

    // 验证确认密码
    if (password !== confirmPassword) {
      error.value = '两次输入的密码不一致';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }

    loading.value = true;

    try {
      // 加密密码
      const encryptedPassword = encryptPassword(password);

      // 构造注册请求
      const registerRequest: RegisterRequest = {
        phone,
        verifyCode,
        password: encryptedPassword,
        confirmPassword: encryptedPassword
      };

      // 调用注册API
      const response = await registerAPI(registerRequest);

      // 检查响应
      if (response.code === 200 && response.data) {
        // 注册成功后，后端返回token和用户信息
        // 计算24小时过期时间
        const expireTime = response.data.expireTime
          ? new Date(response.data.expireTime).getTime()
          : Date.now() + 24 * 60 * 60 * 1000; // 默认24小时

        // 保存token和用户信息到本地缓存
        userStore.setToken(response.data.token, false, expireTime);
        userStore.setUserInfo(response.data.userInfo);

        // 显示成功提示
        ElMessage.success('注册成功');

        // 根据参数决定是否自动跳转
        if (autoRedirect) {
          await router.push('/');
        }

        return { success: true };
      } else {
        // 后端会返回"该手机号已注册"等错误信息
        error.value = response.msg || '注册失败';
        ElMessage.error(error.value);
        return { success: false, error: error.value };
      }
    } catch (e) {
      error.value = (e as Error).message || '注册失败，请稍后重试';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  /**
   * 退出登录
   * @returns Promise<void>
   */
  async function logout(): Promise<void> {
    loading.value = true;

    try {
      // 调用退出登录API
      await logoutAPI();

      // 清除用户状态
      userStore.logout();

      // 显示成功提示
      ElMessage.success('已退出登录');

      // 跳转到登录页
      await router.push('/login');
    } catch (e) {
      // 即使API调用失败，也要清除本地状态
      userStore.logout();
      ElMessage.warning('退出登录');
      await router.push('/login');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 发送验证码
   * @param phone 手机号
   * @param type 验证码类型（register/login/reset）
   * @returns Promise<{ success: boolean, error?: string }>
   */
  async function sendCode(
    phone: string,
    type: 'register' | 'login' | 'reset' = 'register'
  ): Promise<{ success: boolean; error?: string }> {
    // 重置错误状态
    error.value = null;

    // 验证手机号
    if (!validatePhone(phone)) {
      error.value = '请输入正确的手机号';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }

    // 检查是否在倒计时中
    if (countdown.value > 0) {
      error.value = `请等待${countdown.value}秒后再试`;
      ElMessage.warning(error.value);
      return { success: false, error: error.value };
    }

    sendingCode.value = true;

    try {
      // 构造验证码请求
      const verifyCodeRequest: VerifyCodeRequest = {
        phone,
        type
      };

      // 调用发送验证码API
      const response = await sendVerifyCodeAPI(verifyCodeRequest);

      // 检查响应
      if (response.code === 200) {
        // 显示成功提示
        ElMessage.success('验证码已发送');

        // 开始60秒倒计时
        countdown.value = 60;
        const timer = setInterval(() => {
          countdown.value--;
          if (countdown.value <= 0) {
            clearInterval(timer);
          }
        }, 1000);

        return { success: true };
      } else {
        error.value = response.msg || '发送验证码失败';
        ElMessage.error(error.value);
        return { success: false, error: error.value };
      }
    } catch (e) {
      error.value = (e as Error).message || '发送验证码失败，请稍后重试';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    } finally {
      sendingCode.value = false;
    }
  }

  /**
   * 重置错误状态
   */
  function resetError(): void {
    error.value = null;
  }

  /**
   * 重置倒计时
   */
  function resetCountdown(): void {
    countdown.value = 0;
  }

  // ========== 返回公共接口 ==========
  return {
    // 状态（只读）
    loading: readonly(loading),
    error: readonly(error),
    countdown: readonly(countdown),
    sendingCode: readonly(sendingCode),

    // 方法
    login,
    register,
    logout,
    sendCode,
    resetError,
    resetCountdown
  };
}
