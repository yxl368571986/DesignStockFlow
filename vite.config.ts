import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());
  
  // 检查是否启用Mock
  const enableMock = env.VITE_ENABLE_MOCK === 'true';

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: '星潮设计 - 设计资源下载平台',
          short_name: '星潮设计',
          description: '专业的设计资源分享平台，提供PSD、AI、CDR等设计文件下载',
          theme_color: '#165DFF',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          // 预缓存资源列表
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
          
          // 运行时缓存策略
          runtimeCaching: [
            {
              // API请求 - NetworkFirst策略（优先网络，失败时使用缓存）
              urlPattern: /^https:\/\/.*\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24小时
                },
                cacheableResponse: {
                  statuses: [0, 200]
                },
                networkTimeoutSeconds: 10
              }
            },
            {
              // 图片资源 - CacheFirst策略（优先缓存，缓存未命中时请求网络）
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // 字体文件 - CacheFirst策略
              urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // CSS和JS文件 - StaleWhileRevalidate策略
              urlPattern: /\.(?:js|css)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7天
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ],
          
          // 清理过期缓存
          cleanupOutdatedCaches: true,
          
          // 跳过等待，立即激活新的Service Worker
          skipWaiting: true,
          
          // 立即控制所有客户端
          clientsClaim: true
        },
        
        // 开发环境配置
        devOptions: {
          enabled: false, // 开发环境不启用PWA
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000,
      open: true,
      host: true,
      // 只在Mock未启用时配置代理
      proxy: enableMock ? undefined : {
        // 开发环境API代理
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
  build: {
    // 构建目标 - 支持ES2015+的现代浏览器
    target: 'es2015',
    
    // 输出目录
    outDir: 'dist',
    
    // 静态资源目录
    assetsDir: 'assets',
    
    // 生产环境不生成sourcemap（减小体积）
    // 如需调试可设置为 true 或 'inline'
    sourcemap: false,
    
    // 使用Terser进行代码压缩
    minify: 'terser',
    
    // chunk大小警告阈值（KB）
    chunkSizeWarningLimit: 1000,
    
    // Terser压缩配置 - 优化代码体积
    terserOptions: {
      compress: {
        // 移除console和debugger
        drop_console: true,
        drop_debugger: true,
        // 移除未使用的代码
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        // 优化布尔值
        booleans: true,
        // 优化条件语句
        conditionals: true,
        // 移除死代码
        dead_code: true,
        // 优化if语句
        if_return: true,
        // 合并连续变量声明
        join_vars: true,
        // 优化循环
        loops: true,
        // 移除未使用的变量
        unused: true,
        // 移除未使用的函数参数
        keep_fargs: false,
        // 移除未使用的函数名
        keep_fnames: false
      },
      mangle: {
        // 混淆变量名
        safari10: true,
        // 混淆属性名（谨慎使用）
        properties: false
      },
      format: {
        // 移除注释
        comments: false,
        // 美化输出（生产环境设为false）
        beautify: false
      }
    },
    
    // Rollup配置 - 代码分割策略
    rollupOptions: {
      output: {
        // 手动分包策略 - 优化加载性能
        manualChunks: (id) => {
          // Vue核心库（约200KB）
          if (id.includes('node_modules/vue/') || 
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/vue-router/') || 
              id.includes('node_modules/pinia/')) {
            return 'vue-vendor';
          }
          
          // Element Plus UI库（约500KB）
          if (id.includes('node_modules/element-plus/') || 
              id.includes('node_modules/@element-plus/')) {
            return 'element-plus';
          }
          
          // 工具库（约100KB）
          if (id.includes('node_modules/axios/') ||
              id.includes('node_modules/dayjs/') ||
              id.includes('node_modules/crypto-js/') ||
              id.includes('node_modules/xss/') ||
              id.includes('node_modules/dompurify/') ||
              id.includes('node_modules/js-cookie/')) {
            return 'utils';
          }
          
          // PWA相关库（约50KB）
          if (id.includes('node_modules/workbox-') ||
              id.includes('node_modules/vite-plugin-pwa/')) {
            return 'pwa';
          }
          
          // 其他第三方库
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
          
          // 业务组件按目录分包
          if (id.includes('/src/components/business/')) {
            return 'components-business';
          }
          
          if (id.includes('/src/components/common/')) {
            return 'components-common';
          }
          
          if (id.includes('/src/components/layout/')) {
            return 'components-layout';
          }
          
          // Composables
          if (id.includes('/src/composables/')) {
            return 'composables';
          }
          
          // Pinia stores
          if (id.includes('/src/pinia/')) {
            return 'stores';
          }
          
          // Utils
          if (id.includes('/src/utils/')) {
            return 'app-utils';
          }
        },
        
        // 文件命名策略 - 使用hash实现长期缓存
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // 根据文件类型分类存放
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext || '')) {
            return 'images/[name]-[hash].[ext]';
          }
          
          if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
            return 'fonts/[name]-[hash].[ext]';
          }
          
          if (/css/i.test(ext || '')) {
            return 'css/[name]-[hash].[ext]';
          }
          
          return 'assets/[name]-[hash].[ext]';
        },
        
        // 导出格式
        format: 'es',
        
        // 外部依赖（不打包进bundle）
        // 通常用于CDN引入的库
        // external: [],
        
        // 全局变量映射
        // globals: {}
      },
      
      // Tree Shaking优化
      treeshake: {
        // 启用模块副作用检测
        moduleSideEffects: 'no-external',
        // 移除未使用的导出
        propertyReadSideEffects: false,
        // 移除未使用的代码
        tryCatchDeoptimization: false,
        // 更激进的tree shaking
        preset: 'recommended'
      },
      
      // 外部依赖（如果使用CDN）
      // external: ['vue', 'vue-router', 'pinia'],
      
      // 输入配置
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },
    
    // CSS代码分割 - 每个组件的CSS单独打包
    cssCodeSplit: true,
    
    // 启用CSS压缩
    cssMinify: true,
    
    // 报告压缩后的文件大小
    reportCompressedSize: true,
    
    // 禁用brotli大小报告（加快构建速度）
    brotliSize: false,
    
    // 构建时清空输出目录
    emptyOutDir: true,
    
    // 启用/禁用CSS代码拆分
    // 如果禁用，整个项目的CSS将被提取到一个文件中
    // cssCodeSplit: false,
    
    // 自定义底层的Rollup打包配置
    // commonjsOptions: {},
    
    // 构建后是否生成manifest.json
    manifest: false,
    
    // 设置为false可以禁用最小化混淆
    // 或是用来指定使用哪种混淆器
    // minify: 'esbuild', // 更快但压缩率略低
    
    // 传递给esbuild的选项（如果使用esbuild压缩）
    // esbuildOptions: {},
    
    // 启用/禁用gzip压缩大小报告
    // 禁用此项可以略微减少打包时间
    // reportCompressedSize: false,
    
    // 调整chunk大小警告的限制（以kbs为单位）
    // chunkSizeWarningLimit: 500,
    
    // 启用/禁用CSS代码拆分
    // 当启用时，在异步chunk中导入的CSS将内联到异步chunk本身，并在其被加载时插入
    // 如果禁用，整个项目中的所有CSS将被提取到一个CSS文件中
    // cssCodeSplit: true,
    
    // 构建的库模式配置（如果是库项目）
    // lib: {
    //   entry: resolve(__dirname, 'src/index.ts'),
    //   name: 'MyLib',
    //   fileName: (format) => `my-lib.${format}.js`
    // },
    
    // 自定义底层的Rollup打包配置
    // rollupOptions: {},
    
    // @rollup/plugin-commonjs 插件的选项
    // commonjsOptions: {},
    
    // @rollup/plugin-dynamic-import-vars 插件的选项
    // dynamicImportVarsOptions: {},
    
    // 是否将模块提取到单独的chunk中
    // 默认情况下，所有从node_modules导入的模块都会被提取到一个单独的chunk中
    // 设置为false可以禁用此行为
    // modulePreload: true,
    
    // 传递给@rollup/plugin-node-resolve的选项
    // resolve: {},
    
    // 传递给@rollup/plugin-json的选项
    // json: {},
    
    // 传递给@rollup/plugin-wasm的选项
    // wasm: {},
    
    // 传递给@rollup/plugin-worker的选项
    // worker: {},
    
    // 是否注入polyfill
    // polyfillModulePreload: true,
    
    // 是否将动态导入的模块提取到单独的chunk中
    // 默认情况下，所有动态导入的模块都会被提取到单独的chunk中
    // 设置为false可以禁用此行为
    // dynamicImportVarsOptions: {},
  },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'element-plus',
        '@element-plus/icons-vue',
        'axios',
        'dayjs'
      ]
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler', // 使用现代Sass编译器API
          silenceDeprecations: ['legacy-js-api'], // 静默旧API警告
        },
      },
    }
  };
});
