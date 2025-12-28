/**
 * 认证服务
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';
import * as verificationCodeStore from '@/services/sms/verificationCodeStore.js';
import * as rateLimiter from '@/services/sms/rateLimiter.js';
import { sendVerificationCode as sendSms } from '@/services/sms/smsService.js';
import {
  generateVerificationCode,
  validatePhone as validatePhoneFormat,
  validateVerifyCode as validateCodeFormat,
  safeCompare,
  isCodeExpired,
  maskPhone,
} from '@/utils/smsUtils.js';
import type {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  UserInfoResponse,
  JwtPayload,
} from '@/types/auth.js';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const { phone, verify_code, password } = data;

    // 1. 验证手机号格式
    if (!validatePhoneFormat(phone)) {
      const err = new Error('请输入正确的11位手机号');
      (err as Error & { code: string }).code = 'SMS_001';
      throw err;
    }

    // 2. 验证密码强度
    if (!this.validatePassword(password)) {
      throw new Error('密码长度至少6位');
    }

    // 3. 验证验证码格式
    if (!validateCodeFormat(verify_code)) {
      const err = new Error('请输入6位数字验证码');
      (err as Error & { code: string }).code = 'SMS_005';
      throw err;
    }

    // 4. 验证验证码
    const verifyResult = await this.verifyCode(phone, verify_code);
    if (!verifyResult.valid) {
      const err = new Error(verifyResult.message || '验证码错误');
      (err as Error & { code: string }).code = verifyResult.errorCode || 'SMS_005';
      throw err;
    }

    // 5. 检查手机号是否已存在
    const existingUser = await prisma.users.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new Error('用户已存在，该手机号已注册');
    }

    // 6. 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 7. 获取默认角色（普通用户）
    const userRole = await prisma.roles.findUnique({
      where: { role_code: 'user' },
    });

    if (!userRole) {
      throw new Error('系统角色配置错误');
    }

    // 8. 创建用户
    const user = await prisma.users.create({
      data: {
        phone,
        password_hash: passwordHash,
        nickname: `用户${phone.slice(-4)}`,
        role_id: userRole.role_id,
        last_login_at: new Date(),
      },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    logger.info(`用户注册成功: ${user.user_id} - ${maskPhone(phone)}`);

    // 9. 异步删除验证码（注册成功后）
    verificationCodeStore.remove(phone).catch((err) => {
      logger.warn(`删除验证码失败: ${err.message}`);
    });

    // 10. 获取用户权限列表
    const permissions = user.roles?.role_permissions.map(
      (rp) => rp.permissions.permission_code
    ) || [];

    // 11. 生成JWT Token（注册用户默认24小时过期）
    const token = this.generateToken({
      userId: user.user_id,
      phone: user.phone,
      roleCode: user.roles?.role_code || 'user',
      roleId: user.roles?.role_id || '',
      permissions,
    });

    // 12. 计算Token过期时间（注册用户默认24小时）
    const expireTime = this.calculateExpireTime('24h');

    // 13. 返回用户信息和Token
    return {
      token,
      userInfo: this.formatUserInfo(user),
      expireTime,
    };
  }

  /**
   * 用户登录（密码）
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const { phone, password } = data;

    // 1. 查找用户
    const user = await prisma.users.findUnique({
      where: { phone },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      const err = new Error('账号不存在，请检查后重新输入');
      (err as Error & { code: string }).code = 'ACCOUNT_NOT_FOUND';
      throw err;
    }

    // 2. 检查用户状态
    if (user.status === 0) {
      throw new Error('账号已被禁用，请联系管理员');
    }

    // 3. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const err = new Error('密码错误，请重新输入');
      (err as Error & { code: string }).code = 'PASSWORD_INCORRECT';
      throw err;
    }

    // 4. 更新最后登录时间
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { last_login_at: new Date() },
    });

    logger.info(`用户登录成功: ${user.user_id} - ${phone}`);

    // 5. 获取用户权限列表
    const permissions = user.roles?.role_permissions.map(
      (rp) => rp.permissions.permission_code
    ) || [];

    // 6. 生成JWT Token
    const token = this.generateToken({
      userId: user.user_id,
      phone: user.phone,
      roleCode: user.roles?.role_code || 'user',
      roleId: user.roles?.role_id || '',
      permissions,
    });

    // 7. 计算Token过期时间
    const expiresIn = config.jwt.expiresIn || '7d';
    const expireTime = this.calculateExpireTime(expiresIn);

    // 8. 返回用户信息和Token
    return {
      token,
      userInfo: this.formatUserInfo(user),
      expireTime,
    };
  }

  /**
   * 验证码登录
   */
  async loginWithCode(data: { phone: string; verify_code: string }): Promise<LoginResponse> {
    const { phone, verify_code } = data;

    // 1. 验证手机号格式
    if (!validatePhoneFormat(phone)) {
      const err = new Error('请输入正确的11位手机号');
      (err as Error & { code: string }).code = 'SMS_001';
      throw err;
    }

    // 2. 验证验证码格式
    if (!validateCodeFormat(verify_code)) {
      const err = new Error('请输入6位数字验证码');
      (err as Error & { code: string }).code = 'SMS_005';
      throw err;
    }

    // 3. 验证验证码
    const verifyResult = await this.verifyCode(phone, verify_code);
    if (!verifyResult.valid) {
      const err = new Error(verifyResult.message || '验证码错误');
      (err as Error & { code: string }).code = verifyResult.errorCode || 'SMS_005';
      throw err;
    }

    // 4. 查找用户
    let user = await prisma.users.findUnique({
      where: { phone },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    // 5. 如果用户不存在，自动注册
    if (!user) {
      const userRole = await prisma.roles.findUnique({
        where: { role_code: 'user' },
      });

      user = await prisma.users.create({
        data: {
          phone,
          password_hash: await bcrypt.hash('123456', 10), // 默认密码
          nickname: `用户${phone.slice(-4)}`,
          role_id: userRole?.role_id,
          last_login_at: new Date(),
        },
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      });
    }

    // 6. 检查用户状态
    if (user.status === 0) {
      throw new Error('账号已被禁用');
    }

    // 7. 更新最后登录时间
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { last_login_at: new Date() },
    });

    // 8. 异步删除验证码
    verificationCodeStore.remove(phone).catch((err) => {
      logger.warn(`删除验证码失败: ${err.message}`);
    });

    // 9. 获取用户权限列表
    const permissions = user.roles?.role_permissions.map(
      (rp) => rp.permissions.permission_code
    ) || [];

    // 10. 生成JWT Token
    const token = this.generateToken({
      userId: user.user_id,
      phone: user.phone,
      roleCode: user.roles?.role_code || 'user',
      roleId: user.roles?.role_id || '',
      permissions,
    });

    const expiresIn = config.jwt.expiresIn || '7d';
    const expireTime = this.calculateExpireTime(expiresIn);

    return {
      token,
      userInfo: this.formatUserInfo(user),
      expireTime,
    };
  }

  /**
   * 发送验证码
   * @param data 包含手机号和类型
   * @param ip 请求IP地址
   */
  async sendVerifyCode(data: { phone: string; type?: string }, ip: string = '127.0.0.1'): Promise<void> {
    const { phone, type = 'register' } = data;

    // 1. 验证手机号格式
    if (!validatePhoneFormat(phone)) {
      const err = new Error('请输入正确的11位手机号');
      (err as Error & { code: string }).code = 'SMS_001';
      throw err;
    }

    // 2. 检查手机号频率限制
    const phoneLimit = await rateLimiter.checkPhoneLimit(phone);
    if (!phoneLimit.allowed) {
      const err = new Error(phoneLimit.message || '获取验证码过于频繁');
      (err as Error & { code: string }).code = phoneLimit.errorCode || 'SMS_002';
      (err as Error & { code: string; retryAfter?: number }).retryAfter = phoneLimit.retryAfter;
      throw err;
    }

    // 3. 检查IP频率限制
    const ipLimit = await rateLimiter.checkIpLimit(ip);
    if (!ipLimit.allowed) {
      const err = new Error(ipLimit.message || '操作过于频繁');
      (err as Error & { code: string }).code = ipLimit.errorCode || 'SMS_008';
      (err as Error & { code: string; retryAfter?: number }).retryAfter = ipLimit.retryAfter;
      throw err;
    }

    // 4. 生成验证码
    const code = generateVerificationCode();

    // 5. 存储验证码
    await verificationCodeStore.set(phone, code);

    // 6. 记录请求（用于频率限制）
    await rateLimiter.recordRequest(phone, ip);

    // 7. 发送短信
    const result = await sendSms(phone, code);
    
    if (!result.success) {
      // 发送失败，删除已存储的验证码
      await verificationCodeStore.remove(phone);
      const err = new Error(result.errorMessage || '验证码发送失败，请稍后重试');
      (err as Error & { code: string }).code = result.errorCode || 'SMS_004';
      throw err;
    }

    logger.info(`验证码发送成功: ${maskPhone(phone)} - ${type}`);
  }

  /**
   * 验证验证码
   * @param phone 手机号
   * @param code 用户输入的验证码
   * @returns 验证结果
   */
  async verifyCode(phone: string, code: string): Promise<{ valid: boolean; errorCode?: string; message?: string }> {
    try {
      // 1. 从存储获取验证码
      const storedData = await verificationCodeStore.get(phone);

      // 2. 检查是否存在
      if (!storedData) {
        return {
          valid: false,
          errorCode: 'SMS_007',
          message: '验证码无效或已过期',
        };
      }

      // 3. 检查是否已使用
      if (storedData.used) {
        return {
          valid: false,
          errorCode: 'SMS_007',
          message: '验证码已使用，请重新获取',
        };
      }

      // 4. 检查是否过期
      if (isCodeExpired(storedData.createTime)) {
        return {
          valid: false,
          errorCode: 'SMS_006',
          message: '验证码已过期，请重新获取',
        };
      }

      // 5. 比对验证码（使用常量时间比较）
      if (!safeCompare(code, storedData.code)) {
        return {
          valid: false,
          errorCode: 'SMS_005',
          message: '验证码错误，请核对后重新输入',
        };
      }

      // 6. 标记为已使用
      await verificationCodeStore.markAsUsed(phone);

      return { valid: true };
    } catch (error) {
      logger.error(`验证码验证异常: ${error instanceof Error ? error.message : '未知错误'}`);
      return {
        valid: false,
        errorCode: 'SMS_009',
        message: '系统异常，请稍后重试',
      };
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(data: { phone: string; verify_code: string; new_password: string }): Promise<void> {
    const { phone, verify_code, new_password } = data;

    // 1. 验证手机号格式
    if (!validatePhoneFormat(phone)) {
      const err = new Error('请输入正确的11位手机号');
      (err as Error & { code: string }).code = 'SMS_001';
      throw err;
    }

    // 2. 验证验证码格式
    if (!validateCodeFormat(verify_code)) {
      const err = new Error('请输入6位数字验证码');
      (err as Error & { code: string }).code = 'SMS_005';
      throw err;
    }

    // 3. 验证验证码
    const verifyResult = await this.verifyCode(phone, verify_code);
    if (!verifyResult.valid) {
      const err = new Error(verifyResult.message || '验证码错误');
      (err as Error & { code: string }).code = verifyResult.errorCode || 'SMS_005';
      throw err;
    }

    // 4. 验证密码强度
    if (!this.validatePassword(new_password)) {
      throw new Error('密码长度至少6位');
    }

    // 5. 查找用户
    const user = await prisma.users.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 6. 更新密码
    const passwordHash = await bcrypt.hash(new_password, 10);

    await prisma.users.update({
      where: { user_id: user.user_id },
      data: {
        password_hash: passwordHash,
        updated_at: new Date(),
      },
    });

    // 7. 异步删除验证码
    verificationCodeStore.remove(phone).catch((err) => {
      logger.warn(`删除验证码失败: ${err.message}`);
    });

    logger.info(`密码重置成功: ${user.user_id}`);
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, data: { old_password: string; new_password: string }): Promise<void> {
    const { old_password, new_password } = data;

    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(old_password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('原密码错误');
    }

    if (!this.validatePassword(new_password)) {
      throw new Error('新密码长度至少6位');
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    await prisma.users.update({
      where: { user_id: userId },
      data: {
        password_hash: passwordHash,
        updated_at: new Date(),
      },
    });

    logger.info(`密码修改成功: ${userId}`);
  }

  /**
   * 刷新Token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; expireTime: number }> {
    // 验证refresh token
    const payload = this.verifyToken(refreshToken);

    const user = await prisma.users.findUnique({
      where: { user_id: payload.userId },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.status === 0) {
      throw new Error('账号已被禁用');
    }

    const permissions = user.roles?.role_permissions.map(
      (rp) => rp.permissions.permission_code
    ) || [];

    const token = this.generateToken({
      userId: user.user_id,
      phone: user.phone,
      roleCode: user.roles?.role_code || 'user',
      roleId: user.roles?.role_id || '',
      permissions,
    });

    const expiresIn = config.jwt.expiresIn || '7d';
    const expireTime = this.calculateExpireTime(expiresIn);

    return { token, expireTime };
  }

  /**
   * 生成JWT Token
   */
  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  /**
   * 计算Token过期时间
   */
  private calculateExpireTime(expiresIn: string): number {
    const now = Date.now();
    
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
      return now + 7 * 24 * 60 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    let milliseconds = 0;
    switch (unit) {
      case 'd':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      case 'h':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'm':
        milliseconds = value * 60 * 1000;
        break;
      case 's':
        milliseconds = value * 1000;
        break;
      default:
        milliseconds = 7 * 24 * 60 * 60 * 1000;
    }

    return now + milliseconds;
  }

  /**
   * 验证JWT Token
   */
  verifyToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, config.jwt.secret as jwt.Secret) as JwtPayload;
      return payload;
    } catch (error: any) {
      logger.error(`Token验证错误: ${error.message}`);
      throw new Error('Token无效或已过期');
    }
  }

  /**
   * 格式化用户信息
   */
  private formatUserInfo(user: any): UserInfoResponse {
    return {
      userId: user.user_id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      bio: user.bio,
      vipLevel: user.vip_level,
      vipExpireAt: user.vip_expire_at,
      roleCode: user.roles?.role_code || 'user',
      pointsBalance: user.points_balance,
      pointsTotal: user.points_total,
      userLevel: user.user_level,
      status: user.status,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    };
  }

  /**
   * 验证手机号格式
   */
  private validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证密码强度
   */
  private validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  /**
   * 根据用户ID获取用户信息
   */
  async getUserById(userId: string): Promise<UserInfoResponse> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return this.formatUserInfo(user);
  }
}

export const authService = new AuthService();
export default authService;
