import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    // 使用 jsdom 环境
    environment: 'jsdom',
    // 使用线程池
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        isolate: true, // 启用隔离以防止内存泄漏累积
        useAtomics: false
      }
    },
    // 增加超时时间
    testTimeout: 60000,
    hookTimeout: 60000,
    // 限制并发数
    maxConcurrency: 1,
    // 禁用文件并行
    fileParallelism: false,
    // 排除不需要测试的文件
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
    // 设置测试序列化
    sequence: {
      shuffle: false
    },
    // 清理超时
    teardownTimeout: 10000
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 减少esbuild的内存使用
  esbuild: {
    target: 'node18'
  }
});
