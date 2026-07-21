/**
 * 随机 abbrlink 生成器
 * 用于 SEO 友好的 URL
 */
import { createHash } from "crypto";

/**
 * 生成随机 abbrlink
 * 格式：8位16进制字符串
 */
export function generateAbbrlink(title: string, date: Date): string {
  const input = `${title}${date.toISOString()}${Math.random()}`;
  return createHash("md5").update(input).digest("hex").slice(0, 8);
}

/**
 * 验证 abbrlink 格式
 */
export function isValidAbbrlink(link: string): boolean {
  return /^[a-f0-9]{8}$/.test(link);
}
