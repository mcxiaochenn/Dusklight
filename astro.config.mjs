// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";

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

	integrations: [mdx(), sitemap()],

	// 字体配置
	fonts: [
		{
			provider: fontProviders.local(),
			name: "Atkinson",
			cssVariable: "--font-atkinson",
			fallbacks: ["sans-serif"],
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/atkinson-regular.woff"],
						weight: 400,
						style: "normal",
						display: "swap",
					},
					{
						src: ["./src/assets/fonts/atkinson-bold.woff"],
						weight: 700,
						style: "normal",
						display: "swap",
					},
				],
			},
		},
	],

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
