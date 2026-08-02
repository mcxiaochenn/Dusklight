// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icons from "astro-icon";
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import expressiveCode from "astro-expressive-code";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";

// Remark 插件
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import remarkSectionize from "remark-sectionize";
import { remarkContent } from "./src/plugins/remark-content.mjs";
import { remarkPangu } from "./src/plugins/remark-pangu.mjs";
import { siteConfig } from "./src/config/site";
import { remarkFixGithubAdmonitions } from "./src/plugins/remark-fix-github-admonitions.js";
import { remarkEscapeNumericColons } from "./src/plugins/remark-escape-numeric-colons.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";

import { h } from "hastscript";

// Rehype 插件
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeComponents from "rehype-components";
import { rehypeWrapTable } from "./src/plugins/rehype-wrap-table.mjs";
import { rehypeMermaid } from "./src/plugins/rehype-mermaid.mjs";
import { rehypeImageWidth } from "./src/plugins/rehype-image-width.mjs";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { ImageGridComponent } from "./src/plugins/rehype-component-image-grid.mjs";

// 站点配置
const SITE_URL = "https://blog.mcxiaochen.top";

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	trailingSlash: "always",

	integrations: [
		expressiveCode({
			themes: ["github-light", "github-dark"],
			// 语法主题必须跟站内 .dark class 走，而不是系统 prefers-color-scheme。
			// 默认的 useDarkModeMediaQuery 在「系统深色 + 站点浅色」时会套用
			// github-dark 前景色 —— 近白标点 #E1E4E8 落在近白 --code-bg 上不可读，
			// 反向组合（系统浅 + 站点深）则是深字落深底。站内三档切换允许与系统
			// 偏好不一致，代码块必须服从站内档位。
			// .light 选择器在 auto-浅色下不出现在 root 上，但那时无规则命中，
			// 基础主题（github-light）自然生效，行为仍正确。
			useDarkModeMediaQuery: false,
			themeCssSelector: (theme) => (theme.type === "dark" ? ".dark" : ".light"),
			plugins: [
				pluginCollapsibleSections(),
				pluginLineNumbers(),
				pluginLanguageBadge(),
			],
			styleOverrides: {
				borderRadius: "var(--radius-lg)",
				codeFontFamily:
					'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
				frames: {
					editorBackground: "var(--surface-1)",
					terminalBackground: "var(--surface-1)",
					shadow: "none",
					// 框体 chrome 全部走设计 token —— 否则标签栏/终端栏用的是
					// github-light/dark 主题的字面色（#f6f8fa、#fff、橙色指示条
					// #f9826c），不跟 --hue 走，浅色下和全站青绿色系直接冲突
					// 标签栏/标题栏用 color-mix 半透明化 —— frame 是磨砂玻璃，
					// 头部若为不透明实色会形成一条「实心帽子」，材质割裂
					editorTabBarBackground: "color-mix(in oklab, var(--surface-2) 72%, transparent)",
					editorTabBarBorderColor: "transparent",
					editorTabBarBorderBottomColor: "var(--border-subtle)",
					editorActiveTabBackground: "var(--code-bg)",
					editorActiveTabForeground: "var(--foreground)",
					editorActiveTabIndicatorTopColor: "var(--accent)",
					editorActiveTabIndicatorBottomColor: "transparent",
					terminalTitlebarBackground: "color-mix(in oklab, var(--surface-2) 72%, transparent)",
					terminalTitlebarForeground: "var(--foreground-secondary)",
					terminalTitlebarDotsForeground: "var(--foreground-muted)",
					terminalTitlebarBorderBottomColor: "var(--border-subtle)",
				},
			},
		}),
		mdx(),
		sitemap(),
		icons(),
		svelte(),
	],

	// Markdown 配置
	markdown: {
		remarkPlugins: [
			remarkMath,
			// pangu 在 remarkContent 之前：摘录/字数统计基于补完空格的文本
			[remarkPangu, { mode: siteConfig.pangu }],
			remarkContent,
			remarkFixGithubAdmonitions,
			remarkDirective,
			remarkEscapeNumericColons,
			remarkSectionize,
			parseDirectiveNode,
			remarkMermaid,
		],

		rehypePlugins: [
			rehypeKatex,
			[
				rehypeExternalLinks,
				{
					target: "_blank",
					rel: ["noopener", "noreferrer"],
				},
			],
			rehypeSlug,
			rehypeWrapTable,
			rehypeMermaid,
			[
				rehypeComponents,
				{
					components: {
						github: GithubCardComponent,
						grid: ImageGridComponent,
						// 行内剧透遮罩 :spoiler[...]（生产 about.md 使用）
						spoiler: (_props, children) => h("span", { class: "spoiler" }, children),
						note: (x, y) => AdmonitionComponent(x, y, "note"),
						info: (x, y) => AdmonitionComponent(x, y, "info"),
						tip: (x, y) => AdmonitionComponent(x, y, "tip"),
						important: (x, y) => AdmonitionComponent(x, y, "important"),
						caution: (x, y) => AdmonitionComponent(x, y, "caution"),
						warning: (x, y) => AdmonitionComponent(x, y, "warning"),
					},
				},
			],
			[
				rehypeAutolinkHeadings,
				{
					behavior: "append",
					properties: {
						className: ["anchor"],
					},
					content: {
						type: "element",
						tagName: "span",
						properties: {
							className: ["anchor-icon"],
							"data-pagefind-ignore": true,
						},
						children: [{ type: "text", value: "#" }],
					},
				},
			],
			rehypeImageWidth,
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
