/**
 * Vue 3 类型声明文件
 * 解决 TypeScript 在 Vue 单文件组件中的类型检查问题
 */

import type { ComponentPublicInstance, VNode } from 'vue';

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// 全局 JSX 类型声明
declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface ElementClass extends ComponentPublicInstance {}
    interface ElementChildrenAttribute {
      $slots: Record<string, never>;
    }
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}

export {};
