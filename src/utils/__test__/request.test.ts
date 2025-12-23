/**
 * Request模块单元测试
 * 测试请求拦截器、响应拦截器、401错误处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Cookies from 'js-cookie'

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }
}))

// 模拟 element-plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('request 模块', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('handleUnauthorizedError 函数', () => {
    it('应该导出 handleUnauthorizedError 函数', async () => {
      const { handleUnauthorizedError } = await import('../request')
      expect(typeof handleUnauthorizedError).toBe('function')
    })

    it('应该导出 resetUnauthorizedHandling 函数', async () => {
      const { resetUnauthorizedHandling } = await import('../request')
      expect(typeof resetUnauthorizedHandling).toBe('function')
    })

    it('应该导出 getIsHandlingUnauthorized 函数', async () => {
      const { getIsHandlingUnauthorized } = await import('../request')
      expect(typeof getIsHandlingUnauthorized).toBe('function')
    })
  })

  describe('401 错误处理状态管理', () => {
    it('初始状态应该是未处理中', async () => {
      const { getIsHandlingUnauthorized, resetUnauthorizedHandling } = await import('../request')
      resetUnauthorizedHandling()
      expect(getIsHandlingUnauthorized()).toBe(false)
    })

    it('重置后状态应该是未处理中', async () => {
      const { getIsHandlingUnauthorized, resetUnauthorizedHandling } = await import('../request')
      resetUnauthorizedHandling()
      expect(getIsHandlingUnauthorized()).toBe(false)
    })
  })

  describe('Token 过期处理', () => {
    it('Token不存在时 handleUnauthorizedError 应该执行退出登录', async () => {
      // 模拟没有token
      vi.mocked(Cookies.get).mockImplementation((key: string) => {
        if (key === 'auth_token') return undefined
        if (key === 'token_expire_time') return undefined
        return undefined
      })

      const { handleUnauthorizedError, resetUnauthorizedHandling } = await import('../request')
      resetUnauthorizedHandling()

      // 调用handleUnauthorizedError
      await handleUnauthorizedError()

      // 验证调用了removeToken (通过Cookies.remove)
      expect(Cookies.remove).toHaveBeenCalled()
    })

    it('Token已过期时 handleUnauthorizedError 应该执行退出登录', async () => {
      const expiredTime = Date.now() - 10000 // 10秒前过期

      vi.mocked(Cookies.get).mockImplementation((key: string) => {
        if (key === 'auth_token') return 'test-token'
        if (key === 'token_expire_time') return expiredTime.toString()
        return undefined
      })

      const { handleUnauthorizedError, resetUnauthorizedHandling } = await import('../request')
      resetUnauthorizedHandling()

      await handleUnauthorizedError()

      // 验证调用了removeToken
      expect(Cookies.remove).toHaveBeenCalled()
    })
  })

  describe('请求方法导出', () => {
    it('应该导出 get 方法', async () => {
      const { get } = await import('../request')
      expect(typeof get).toBe('function')
    })

    it('应该导出 post 方法', async () => {
      const { post } = await import('../request')
      expect(typeof post).toBe('function')
    })

    it('应该导出 put 方法', async () => {
      const { put } = await import('../request')
      expect(typeof put).toBe('function')
    })

    it('应该导出 del 方法', async () => {
      const { del } = await import('../request')
      expect(typeof del).toBe('function')
    })

    it('应该导出 patch 方法', async () => {
      const { patch } = await import('../request')
      expect(typeof patch).toBe('function')
    })

    it('应该导出 upload 方法', async () => {
      const { upload } = await import('../request')
      expect(typeof upload).toBe('function')
    })

    it('应该导出 download 方法', async () => {
      const { download } = await import('../request')
      expect(typeof download).toBe('function')
    })
  })

  describe('默认导出', () => {
    it('应该导出 axios 实例', async () => {
      const { default: request } = await import('../request')
      expect(request).toBeDefined()
      expect(typeof request.get).toBe('function')
      expect(typeof request.post).toBe('function')
      expect(typeof request.interceptors).toBe('object')
    })
  })
})
