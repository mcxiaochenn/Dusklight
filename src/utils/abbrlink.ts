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

/* ─────────────────────────────────────────────────────────
 * 文章 URL 解析 —— 路由与所有链接生成都走下面两个函数。
 *
 * 注意上面的 generateAbbrlink 不参与路由：它算的是
 * md5(title + date)，跟线上已有的 abbrlink 值对不上，
 * 自动生成会把所有老链接和 Twikoo 评论线程全部打断。
 * abbrlink 只认 frontmatter 里显式写的值。
 * ───────────────────────────────────────────────────────── */

/** 路由和链接只依赖这两个字段，不引 astro:content 的完整类型 */
type PostLike = { id: string; data: { abbrlink?: string } };

/**
 * 解析文章的 URL slug。
 * 写了 abbrlink 就用 abbrlink，没写则回退到内容文件路径（post.id）。
 * 与线上博客一致：/posts/p6eae1621/ 与 /posts/mi-unlock-713/ 并存。
 */
export function getPostSlug(post: PostLike): string {
  return post.data.abbrlink?.trim() || post.id;
}

/** 文章站内路径。带尾斜杠 —— astro.config.mjs 设了 trailingSlash: "always" */
export function getPostUrl(post: PostLike): string {
  return `/posts/${getPostSlug(post)}/`;
}
