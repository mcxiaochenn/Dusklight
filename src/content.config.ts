import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * 内容集合配置
 *
 * 注意：由于使用 symlink 机制，路径指向 src/content/
 * 实际内容来自独立的内容仓库 (Dusklight-Content)
 */

const blog = defineCollection({
	// 通过 symlink 映射到内容仓库的 blog/ 目录
	loader: glob({ base: "./src/content", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			// 基础信息
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),

			// 分类标签
			tags: z.array(z.string()).default([]),
			category: z.string().optional(),

			// 封面图（支持 heroImage 和 cover 两种写法）
			heroImage: image().optional(),
			cover: z.string().optional(),
			coverAlt: z.string().optional(),

			// SEO 友好链接（手动指定优先，否则自动生成）
			abbrlink: z.string().optional(),

			// 状态
			draft: z.boolean().default(false),
			pinned: z.boolean().default(false),

			// 功能开关
			comment: z.boolean().default(true),
			toc: z.boolean().default(true),
		}),
});

export const collections = { blog };
