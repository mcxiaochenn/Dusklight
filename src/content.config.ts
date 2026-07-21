import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * 内容集合配置
 */

// 博客文章
const blog = defineCollection({
	loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			tags: z.array(z.string()).default([]),
			category: z.string().optional(),
			heroImage: image().optional(),
			cover: z.string().optional(),
			coverAlt: z.string().optional(),
			abbrlink: z.string().optional(),
			draft: z.boolean().default(false),
			pinned: z.boolean().default(false),
			comment: z.boolean().default(true),
			toc: z.boolean().default(true),
		}),
});

// 独立页面（about / friends / ...）— 无 frontmatter 约束
const spec = defineCollection({
	loader: glob({ base: "./src/content/spec", pattern: "**/*.{md,mdx}" }),
});

export const collections = { blog, spec };
