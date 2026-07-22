/**
 * 确定性 abbrlink 生成器
 * 相同的 title + date 总是产生相同的 abbrlink，保证 URL 稳定性。
 */
import { createHash } from "crypto";

/**
 * 生成确定性 abbrlink
 * 格式：8位16进制字符串
 */
export function generateAbbrlink(title: string, date: Date): string {
  const input = `${title}${date.toISOString()}`;
  return createHash("md5").update(input).digest("hex").slice(0, 8);
}

/**
 * 验证 abbrlink 格式
 */
export function isValidAbbrlink(link: string): boolean {
  return /^[a-f0-9]{8}$/.test(link);
}
