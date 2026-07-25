// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icons from "astro-icon";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";

// Remark 插件
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import remarkSectionize from "remark-sectionize";
import { remarkContent } from "./src/plugins/remark-content.mjs";
import { remarkFixGithubAdmonitions } from "./src/plugins/remark-fix-github-admonitions.js";
import { remarkEscapeNumericColons } from "./src/plugins/remark-escape-numeric-colons.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";

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
				},
			},
		}),
		mdx(),
		sitemap(),
		icons(),
	],

	// Markdown 配置
	markdown: {
		remarkPlugins: [
			remarkMath,
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
						note: (x, y) => AdmonitionComponent(x, y, "note"),
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
