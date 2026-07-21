// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icons from "astro-icon";
import { defineConfig } from "astro/config";

// Markdown 插件
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";

// 站点配置
const SITE_URL = "https://blog.mcxiaochen.top";

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	trailingSlash: "always",

	integrations: [mdx(), sitemap(), icons()],

	// 字体通过 @fontsource-variable/inter 在 CSS 中加载

	// Markdown 配置
	markdown: {
		// Shiki 语法高亮
		shikiConfig: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
		},

		// Remark 插件（Markdown 扩展）
		remarkPlugins: [
			remarkMath, // 数学公式：$...$ 和 $$...$$
		],

		// Rehype 插件（HTML 处理）
		rehypePlugins: [
			rehypeKatex, // KaTeX 渲染
			rehypeSlug, // 标题添加 id
			[rehypeAutolinkHeadings, { behavior: "wrap" }], // 标题链接
			[
				rehypeExternalLinks,
				{
					target: "_blank",
					rel: ["noopener", "noreferrer"],
				},
			], // 外部链接新窗口打开
		],
	},

	// 预加载策略
	prefetch: {
		prefetchAll: true,
		defaultStrategy: "hover",
	},

	// Vite 配置
	vite: {
		resolve: {
			alias: {
				"@": "/src",
			},
		},
	},
});
