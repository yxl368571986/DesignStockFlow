/**
 * 认证服务
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';
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
    if (!this.validatePhone(phone)) {
      throw new Error('手机号格式不正确');
    }

    // 2. 验证密码强度
    if (!this.validatePassword(password)) {
      throw new Error('密码长度至少6位');
    }

    // 3. 验证验证码（TODO: 从Redis中验证）
    logger.info(`验证码验证: ${phone} - ${verify_code}`);

    // 4. 检查手机号是否已存在
    const existingUser = await prisma.users.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new Error('该手机号已注册');
    }

    // 5. 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 6. 获取默认角色（普通用户）
    const userRole = await prisma.roles.findUnique({
      where: { role_code: 'user' },
    });

    if (!userRole) {
      throw new Error('系统角色配置错误');
    }

    // 7. 创建用户
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

    logger.info(`用户注册成功: ${user.user_id} - ${phone}`);

    // 8. 获取用户权限列表
    const permissions = user.roles?.role_permissions.map(
      (rp) => rp.permissions.permission_code
    ) || [];

    // 9. 生成JWT Token
    const token = this.generateToken({
      userId: user.user_id,
      phone: user.phone,
      roleCode: user.roles?.role_code || 'user',
      roleId: user.roles?.role_id || '',
      permissions,
    });

    // 10. 计算Token过期时间
    const expiresIn = config.jwt.expiresIn || '7d';
    const expireTime = this.calculateExpireTime(expiresIn);

    // 11. 返回用户信息和Token
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
      throw new Error('手机号或密码错误');
    }

    // 2. 检查用户状态
    if (user.status === 0) {
      throw new Error('账号已被禁用，请联系管理员');
    }

    // 3. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('手机号或密码错误');
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

    // 验证验证码（TODO: 从Redis中验证）
    logger.info(`验证码登录: ${phone} - ${verify_code}`);

    // 查找用户
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

    // 如果用户不存在，自动注册
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

    // 检查用户状态
    if (user.status === 0) {
      throw new Error('账号已被禁用');
    }

    // 更新最后登录时间
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { last_login_at: new Date() },
    });

    // 获取用户权限列表
    const permissions = user.roles?.role_permissions.map(
      (rp) => rp.permissions.permission_code
    ) || [];

    // 生成JWT Token
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
   */
  async sendVerifyCode(data: { phone: string; type?: string }): Promise<void> {
    const { phone, type = 'login' } = data;

    if (!this.validatePhone(phone)) {
      throw new Error('手机号格式不正确');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    logger.info(`验证码: ${phone} - ${code} - ${type}`);
    // TODO: 实现Redis存储和短信发送
  }

  /**
   * 重置密码
   */
  async resetPassword(data: { phone: string; verify_code: string; new_password: string }): Promise<void> {
    const { phone, verify_code, new_password } = data;

    // 验证验证码（TODO: 从Redis中验证）
    logger.info(`重置密码验证码: ${phone} - ${verify_code}`);

    if (!this.validatePassword(new_password)) {
      throw new Error('密码长度至少6位');
    }

    const user = await prisma.users.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    await prisma.users.update({
      where: { user_id: user.user_id },
      data: {
        password_hash: passwordHash,
        updated_at: new Date(),
      },
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
