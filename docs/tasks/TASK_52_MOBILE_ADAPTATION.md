# Task 52: 配置移动端适配（postcss.config.js）

## 任务完成状态：✅ 已完成

## 实施内容

### 1. 安装 postcss-px-to-viewport-8-plugin 插件

```bash
npm install -D postcss-px-to-viewport-8-plugin --registry=https://registry.npmjs.org/
```

**安装结果：** ✅ 成功安装

### 2. 配置 postcss.config.js

已更新 `postcss.config.js` 文件，配置内容如下：

```javascript
import postcsspxtoviewport from 'postcss-px-to-viewport-8-plugin';

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-px-to-viewport-8-plugin': postcsspxtoviewport({
      // 视口宽度，对应设计稿宽度
      viewportWidth: 375,
      // 视口高度，对应设计稿高度（可选）
      viewportHeight: 667,
      // 转换后的单位精度
      unitPrecision: 5,
      // 需要转换的CSS属性，*表示所有
      propList: ['*'],
      // 转换后的视口单位
      viewportUnit: 'vw',
      // 字体转换后的视口单位
      fontViewportUnit: 'vw',
      // 需要忽略的选择器，保留为px
      selectorBlackList: [
        '.ignore',
        '.hairlines',
        // 排除Element Plus组件样式
        'el-',
        // 排除Element Plus图标
        'ElIcon',
      ],
      // 最小转换的px值，小于此值不转换
      minPixelValue: 1,
      // 是否允许在媒体查询中转换px
      mediaQuery: false,
      // 是否转换行内样式中的px
      replace: true,
      // 排除的文件或文件夹
      exclude: [
        /node_modules/,
        // 排除Element Plus样式文件
        /element-plus/,
      ],
      // 包含的文件或文件夹（可选）
      include: undefined,
      // 是否处理横屏情况
      landscape: false,
      // 横屏时使用的单位
      landscapeUnit: 'vw',
      // 横屏时的视口宽度
      landscapeWidth: 667,
    }),
  },
}
```

### 3. 配置详解

#### 3.1 视口宽度配置
- **viewportWidth: 375** - 基于 375px 设计稿宽度（iPhone 6/7/8 标准尺寸）
- **viewportHeight: 667** - 对应设计稿高度

#### 3.2 转换单位配置
- **viewportUnit: 'vw'** - 将 px 转换为 vw 单位
- **fontViewportUnit: 'vw'** - 字体也使用 vw 单位
- **unitPrecision: 5** - 转换精度为 5 位小数

#### 3.3 Element Plus 样式排除
通过以下配置确保 Element Plus 组件样式不被转换：

1. **selectorBlackList**: 排除以 `el-` 开头的选择器和 `ElIcon`
2. **exclude**: 排除 `node_modules` 和 `element-plus` 文件夹

这样可以保证：
- Element Plus 组件保持原有的 px 单位
- 自定义样式正常转换为 vw
- 第三方库样式不受影响

#### 3.4 其他配置
- **minPixelValue: 1** - 最小转换值为 1px，小于此值不转换
- **replace: true** - 直接替换 px 值，不保留原值
- **mediaQuery: false** - 媒体查询中的 px 不转换

### 4. 转换示例

#### 转换前（CSS）：
```css
.test-element {
  width: 375px;      /* 设计稿宽度 */
  height: 200px;
  margin: 10px;
  padding: 20px;
  font-size: 16px;
}

/* Element Plus 样式不转换 */
.el-button {
  width: 100px;
  height: 40px;
}

/* 忽略的类不转换 */
.ignore {
  width: 100px;
}
```

#### 转换后（预期）：
```css
.test-element {
  width: 100vw;      /* 375px / 375 = 100vw */
  height: 53.33333vw; /* 200px / 375 = 53.33333vw */
  margin: 2.66667vw;  /* 10px / 375 = 2.66667vw */
  padding: 5.33333vw; /* 20px / 375 = 5.33333vw */
  font-size: 4.26667vw; /* 16px / 375 = 4.26667vw */
}

/* Element Plus 样式保持不变 */
.el-button {
  width: 100px;
  height: 40px;
}

/* 忽略的类保持不变 */
.ignore {
  width: 100px;
}
```

### 5. 验证结果

#### 5.1 插件加载验证
```bash
node -e "import('postcss-px-to-viewport-8-plugin').then(() => console.log('Plugin loaded successfully'))"
```
**结果：** ✅ Plugin loaded successfully

#### 5.2 配置文件验证
- ✅ postcss.config.js 文件已更新
- ✅ 插件配置正确导入
- ✅ 所有配置项符合需求

### 6. 使用说明

#### 6.1 自动转换
在项目中编写 CSS 时，直接使用 px 单位即可：

```css
/* 编写时使用 px */
.my-component {
  width: 200px;
  height: 100px;
  font-size: 14px;
}

/* 构建后自动转换为 vw */
.my-component {
  width: 53.33333vw;
  height: 26.66667vw;
  font-size: 3.73333vw;
}
```

#### 6.2 保持 px 不转换
如果某些样式需要保持 px 单位，可以：

1. **使用 ignore 类**：
```css
.ignore {
  width: 100px; /* 不会被转换 */
}
```

2. **使用 Element Plus 组件**：
```css
.el-button {
  width: 100px; /* 不会被转换 */
}
```

3. **在 node_modules 中的样式**：
所有第三方库的样式都不会被转换

#### 6.3 响应式设计
配置基于 375px 设计稿，在不同设备上会自动适配：

- **iPhone SE (375px)**: 1:1 显示
- **iPhone 12 (390px)**: 自动放大 390/375 = 1.04 倍
- **iPhone 12 Pro Max (428px)**: 自动放大 428/375 = 1.14 倍
- **iPad (768px)**: 自动放大 768/375 = 2.05 倍

### 7. 注意事项

1. **设计稿尺寸**：所有设计稿应基于 375px 宽度
2. **Element Plus**：组件库样式已排除，不会被转换
3. **第三方库**：node_modules 中的样式不会被转换
4. **精度控制**：转换精度为 5 位小数，足够精确
5. **最小值**：小于 1px 的值不会被转换

### 8. 需求映射

✅ **需求 15.1（移动端适配）**：
- 安装 postcss-px-to-viewport 插件
- 配置视口宽度为 375px（设计稿标准）
- 配置转换单位为 vw
- 排除 Element Plus 样式转换
- 支持响应式设计，自动适配不同设备

## 任务验收

- [x] 安装 postcss-px-to-viewport-8-plugin 插件
- [x] 配置视口宽度（375px 设计稿）
- [x] 配置转换单位（px → vw）
- [x] 排除 Element Plus 样式转换
- [x] 插件加载验证通过
- [x] 配置文件语法正确

## 后续建议

1. **测试转换效果**：在实际组件中测试 px 到 vw 的转换
2. **调整排除规则**：根据实际需要调整 selectorBlackList
3. **性能监控**：观察转换对构建性能的影响
4. **兼容性测试**：在不同设备上测试响应式效果

## 相关文件

- `postcss.config.js` - PostCSS 配置文件
- `package.json` - 依赖配置
- `test-postcss.css` - 测试文件（可删除）

---

**任务完成时间：** 2024-12-20
**执行人：** Kiro AI Assistant
**状态：** ✅ 已完成
