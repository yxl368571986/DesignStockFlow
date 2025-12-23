/**
 * 认证相关类型定义
 */

// 用户注册请求
export interface RegisterRequest {
  phone: string;
  verify_code: string;
  password: string;
}

// 用户登录请求（密码）
export interface LoginRequest {
  phone: string;
  password: string;
  remember_me?: boolean;
}

// 验证码登录请求
export interface CodeLoginRequest {
  phone: string;
  verify_code: string;
}

// 发送验证码请求
export interface SendCodeRequest {
  phone: string;
  type: 'register' | 'login' | 'reset';
}

// 用户信息响应
export interface UserInfoResponse {
  userId: string;
  phone: string;
  nickname: string | null;
  avatar: string | null;
  email: string | null;
  bio: string | null;
  vipLevel: number;
  vipExpireAt: Date | null;
  roleCode: string;
  pointsBalance: number;
  pointsTotal: number;
  userLevel: number;
  status: number;
  createdAt: Date;
  lastLoginAt: Date | null;
}

// 登录响应
export interface LoginResponse {
  token: string;
  userInfo: UserInfoResponse;
  expireTime?: number; // Token过期时间戳（毫秒）
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  phone: string;
  roleCode: string;
  roleId: string;
  permissions?: string[]; // 权限代码列表
  iat?: number;
  exp?: number;
}
