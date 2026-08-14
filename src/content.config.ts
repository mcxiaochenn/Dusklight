import { existsSync } from "node:fs";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * 内容集合配置
 *
 * 内容分离：content/ 是私有内容仓库的本地克隆（scripts/sync-content.js 负责
 * clone/更新，整个目录在 .gitignore 中）。存在时集合直接从中读取，否则退回
 * 仓库内置的演示内容。刻意不用 junction/symlink —— Windows 上 git 会穿越
 * junction 递归其内容，私有文章会以未跟踪文件形式出现在框架仓库工作区，
 * 一次 git add . 就会把不开源的文章提交进公开仓库。
 */
const synced = existsSync("./content/blog/posts");

// 博客文章
const blog = defineCollection({
	loader: glob({
		base: synced ? "./content/blog/posts" : "./src/content/posts",
		pattern: "**/*.{md,mdx}",
	}),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updated: z.coerce.date().optional(),
		description: z.string(),
		tags: z.array(z.string()).default([]),
		category: z.string().optional(),
		cover: z.string().optional(),
		pinned: z.boolean().default(false),
		author: z.string().optional(),
		draft: z.boolean().default(false),
		abbrlink: z.string().optional(),
		comment: z.boolean().default(true),
		toc: z.boolean().default(true),
		password: z.string().optional(),
		hint: z.string().optional(),
		share: z.boolean().default(true),
		license: z.union([
			z.literal(false),
			z.object({ name: z.string(), url: z.string().url() }),
		]).optional(),
	}),
});

// 独立页面（about / friends / ...）— 无 frontmatter 约束
const spec = defineCollection({
	loader: glob({
		base: synced ? "./content/blog/spec" : "./src/content/spec",
		pattern: "**/*.{md,mdx}",
	}),
});

export const collections = { blog, spec };
