import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * 内容集合配置
 */

// 博客文章
const blog = defineCollection({
	loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
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
	}),
});

// 独立页面（about / friends / ...）— 无 frontmatter 约束
const spec = defineCollection({
	loader: glob({ base: "./src/content/spec", pattern: "**/*.{md,mdx}" }),
});

export const collections = { blog, spec };
