/**
 * Request模块属性测试
 * 使用fast-check进行属性测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
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

describe('request 模块属性测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('401错误处理属性测试', () => {
    it('任意过期时间戳（小于当前时间）都应该触发退出登录', async () => {
      const { handleUnauthorizedError, resetUnauthorizedHandling } = await import('../request')

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: Date.now() - 10000 }), // 过去的时间戳
          async (expiredTime) => {
            vi.clearAllMocks()
            resetUnauthorizedHandling()

            vi.mocked(Cookies.get).mockImplementation((key: string) => {
              if (key === 'auth_token') return 'test-token'
              if (key === 'token_expire_time') return expiredTime.toString()
              return undefined
            })

            await handleUnauthorizedError()

            // Token过期应该调用remove
            expect(Cookies.remove).toHaveBeenCalled()
          }
        ),
        { numRuns: 10 }
      )
    })

    it('没有token时应该触发退出登录', async () => {
      const { handleUnauthorizedError, resetUnauthorizedHandling } = await import('../request')

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(undefined, ''),
          async (token) => {
            vi.clearAllMocks()
            resetUnauthorizedHandling()

            vi.mocked(Cookies.get).mockImplementation((key: string) => {
              if (key === 'auth_token') return token
              if (key === 'token_expire_time') return undefined
              return undefined
            })

            await handleUnauthorizedError()

            // 没有token应该调用remove
            expect(Cookies.remove).toHaveBeenCalled()
          }
        ),
        { numRuns: 5 }
      )
    })
  })

  describe('状态管理属性测试', () => {
    it('重置后状态应该始终为未处理中', async () => {
      const { getIsHandlingUnauthorized, resetUnauthorizedHandling } = await import('../request')

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (resetCount) => {
            // 多次重置
            for (let i = 0; i < resetCount; i++) {
              resetUnauthorizedHandling()
            }

            expect(getIsHandlingUnauthorized()).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('导出函数属性测试', () => {
    it('所有HTTP方法都应该是函数', async () => {
      const requestModule = await import('../request')

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('get', 'post', 'put', 'del', 'patch', 'upload', 'download'),
          async (methodName) => {
            const method = (requestModule as any)[methodName]
            expect(typeof method).toBe('function')
          }
        ),
        { numRuns: 7 }
      )
    })
  })
})
