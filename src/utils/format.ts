/**
 * 格式化工具模块
 * 提供文件大小、时间、数字、下载次数等格式化功能
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 配置dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

/**
 * 文件大小格式化
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小（如：1.5 MB）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 时间格式化
 * @param time 时间字符串或时间戳
 * @param format 格式（默认：YYYY-MM-DD HH:mm:ss）
 * @returns 格式化后的时间
 */
export function formatTime(
  time: string | number | Date,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  return dayjs(time).format(format);
}

/**
 * 数字格式化（千分位）
 * @param num 数字
 * @returns 格式化后的数字（如：1,234,567）
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 下载次数格式化
 * @param count 下载次数
 * @returns 格式化后的下载次数（如：1.2k, 1.5w）
 */
export function formatDownloadCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 10000) {
    return `${(count / 1000).toFixed(1)}k`;
  } else {
    return `${(count / 10000).toFixed(1)}w`;
  }
}

/**
 * 相对时间格式化
 * @param time 时间字符串或时间戳
 * @returns 相对时间（如：刚刚、5分钟前、2小时前）
 */
export function formatRelativeTime(time: string | number | Date): string {
  const now = dayjs();
  const target = dayjs(time);
  const diffSeconds = now.diff(target, 'second');

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}分钟前`;
  } else if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)}小时前`;
  } else if (diffSeconds < 2592000) {
    return `${Math.floor(diffSeconds / 86400)}天前`;
  } else {
    return formatTime(time, 'YYYY-MM-DD');
  }
}

/**
 * 价格格式化
 * @param price 价格
 * @returns 格式化后的价格（如：¥99.00）
 */
export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

/**
 * 百分比格式化
 * @param value 数值（0-1）
 * @param decimals 小数位数（默认：0）
 * @returns 格式化后的百分比（如：85%）
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 手机号格式化（添加空格）
 * @param phone 手机号
 * @returns 格式化后的手机号（如：138 1234 5678）
 */
export function formatPhone(phone: string): string {
  if (!phone || phone.length !== 11) {
    return phone;
  }
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
}

/**
 * 银行卡号格式化（添加空格）
 * @param cardNumber 银行卡号
 * @returns 格式化后的银行卡号（如：6222 0000 0000 0000）
 */
export function formatBankCard(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * 时长格式化（秒转时分秒）
 * @param seconds 秒数
 * @returns 格式化后的时长（如：01:23:45）
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ];

  return parts.join(':');
}
