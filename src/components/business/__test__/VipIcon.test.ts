/**
 * VipIcon组件单元测试
 * 测试VIP图标的不同状态和尺寸显示
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VipIcon from '../VipIcon.vue';

describe('VipIcon', () => {
  describe('渲染测试', () => {
    it('status为none时不应该渲染图标', () => {
      const wrapper = mount(VipIcon, {
        props: { status: 'none' }
      });

      expect(wrapper.find('.vip-icon-wrapper').exists()).toBe(false);
    });

    it('status为active时应该渲染金色图标', () => {
      const wrapper = mount(VipIcon, {
        props: { status: 'active' }
      });

      expect(wrapper.find('.vip-icon-wrapper').exists()).toBe(true);
      const svg = wrapper.find('svg');
      expect(svg.exists()).toBe(true);
      
      // 检查填充颜色是金色
      const path = wrapper.find('path');
      expect(path.attributes('fill')).toBe('#FFD700');
    });

    it('status为grace时应该渲染灰色图标', () => {
      const wrapper = mount(VipIcon, {
        props: { status: 'grace' }
      });

      expect(wrapper.find('.vip-icon-wrapper').exists()).toBe(true);
      
      // 检查填充颜色是灰色
      const path = wrapper.find('path');
      expect(path.attributes('fill')).toBe('#9CA3AF');
    });

    it('status为lifetime时应该渲染金色图标和终身标签', () => {
      const wrapper = mount(VipIcon, {
        props: { status: 'lifetime' }
      });

      expect(wrapper.find('.vip-icon-wrapper').exists()).toBe(true);
      
      // 检查填充颜色是金色
      const path = wrapper.find('path');
      expect(path.attributes('fill')).toBe('#FFD700');
      
      // 检查终身标签
      expect(wrapper.find('.lifetime-label').exists()).toBe(true);
      expect(wrapper.find('.lifetime-label').text()).toBe('终身');
    });

    it('showLifetimeLabel为false时不应该显示终身标签', () => {
      const wrapper = mount(VipIcon, {
        props: { 
          status: 'lifetime',
          showLifetimeLabel: false
        }
      });

      expect(wrapper.find('.vip-icon-wrapper').exists()).toBe(true);
      expect(wrapper.find('.lifetime-label').exists()).toBe(false);
    });
  });

  describe('尺寸测试', () => {
    it('默认尺寸应该是medium', () => {
      const wrapper = mount(VipIcon, {
        props: { status: 'active' }
      });

      expect(wrapper.find('.vip-icon-wrapper').classes()).toContain('size-medium');
      
      const svg = wrapper.find('svg');
      expect(svg.attributes('width')).toBe('20');
      expect(svg.attributes('height')).toBe('20');
    });

    it('size为small时应该渲染小尺寸图标', () => {
      const wrapper = mount(VipIcon, {
        props: { 
          status: 'active',
          size: 'small'
        }
      });

      expect(wrapper.find('.vip-icon-wrapper').classes()).toContain('size-small');
      
      const svg = wrapper.find('svg');
      expect(svg.attributes('width')).toBe('16');
      expect(svg.attributes('height')).toBe('16');
    });

    it('size为large时应该渲染大尺寸图标', () => {
      const wrapper = mount(VipIcon, {
        props: { 
          status: 'active',
          size: 'large'
        }
      });

      expect(wrapper.find('.vip-icon-wrapper').classes()).toContain('size-large');
      
      const svg = wrapper.find('svg');
      expect(svg.attributes('width')).toBe('28');
      expect(svg.attributes('height')).toBe('28');
    });
  });

  describe('边框颜色测试', () => {
    it('active状态应该有金色边框', () => {
      const wrapper = mount(VipIcon, {
        props: { status: 'active' }
      });

      const path = wrapper.find('path');
      expect(path.attributes('stroke')).toBe('#B8860B');
    });

    it('grace状态应该有灰色边框', () => {
      const wrapper = mount(VipIcon, {
        props: { status: 'grace' }
      });

      const path = wrapper.find('path');
      expect(path.attributes('stroke')).toBe('#6B7280');
    });

    it('lifetime状态应该有金色边框', () => {
      const wrapper = mount(VipIcon, {
        props: { status: 'lifetime' }
      });

      const path = wrapper.find('path');
      expect(path.attributes('stroke')).toBe('#B8860B');
    });
  });

  describe('默认值测试', () => {
    it('应该使用正确的默认props', () => {
      const wrapper = mount(VipIcon);

      // 默认status为none，不渲染
      expect(wrapper.find('.vip-icon-wrapper').exists()).toBe(false);
    });
  });
});
