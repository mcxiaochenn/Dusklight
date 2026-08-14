<div align="center">

# Dusklight

一款基于 Astro 的现代个人博客主题。

以玻璃质感、内容阅读体验与渐进增强为核心，在纯静态输出中组合 Svelte 交互岛、全文搜索、评论与丰富的 Markdown 能力。

[在线演示](https://blog.mcxiaochen.top/) · [使用指南](#快速开始) · [问题反馈](https://github.com/mcxiaochenn/Dusklight/issues)

[![Release](https://img.shields.io/github/v/release/mcxiaochenn/Dusklight?style=flat-square&color=14b8a6)](https://github.com/mcxiaochenn/Dusklight/releases/latest)
[![Deploy](https://img.shields.io/github/actions/workflow/status/mcxiaochenn/Dusklight/deploy.yml?branch=main&style=flat-square&label=deploy)](https://github.com/mcxiaochenn/Dusklight/actions/workflows/deploy.yml)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white)](https://astro.build/)
[![License](https://img.shields.io/github/license/mcxiaochenn/Dusklight?style=flat-square&color=14b8a6)](LICENSE)

</div>

## 预览

<table>
  <tr>
    <th width="72%">桌面端</th>
    <th width="28%">移动端</th>
  </tr>
  <tr>
    <td valign="top"><img src="assets/preview-desktop.png" alt="Dusklight 桌面端首页预览" width="100%"></td>
    <td valign="top"><img src="assets/preview-mobile.png" alt="Dusklight 移动端首页预览" width="100%"></td>
  </tr>
</table>

## 亮点

- **玻璃视觉系统**：统一的色彩、阴影、模糊与连续曲率圆角；不支持新 CSS 能力的浏览器自动回退到普通圆角。
- **响应式布局**：桌面侧栏、文章目录、移动端导航和触控交互均按断点适配。
- **三档主题**：支持浅色、深色与跟随系统，并结合 View Transitions 提供平滑切换。
- **内容体验**：Astro Content Collections、MDX、数学公式、Mermaid、图片网格、提示块与 Expressive Code。
- **全文搜索**：Pagefind Extended 构建中文静态索引，Svelte 搜索面板支持键盘导航与 `Ctrl/Cmd + K`。
- **文章能力**：阅读目录、文章加密、分享海报、许可信息、内容仓库变更记录、评论与站外链接中转。
- **博客页面**：分类、标签、归档、关于、友链、追番、设备、技能与开发时间线。
- **站点服务**：RSS、Atom、Sitemap、结构化数据、Umami 统计、Twikoo 评论和友链服务 JSON。
- **轻量运行时**：Astro 默认静态预渲染，Svelte 只用于搜索和海报等必要的交互岛。

## 技术栈

| 分类 | 方案 |
| --- | --- |
| 框架 | Astro 7、TypeScript、Svelte 5 |
| 样式 | 原生 CSS Token、Tailwind CSS 4 Utilities |
| 内容 | Astro Content Collections、Markdown、MDX |
| 搜索 | Pagefind Extended |
| 图标 | Font Awesome 7、Simple Icons、Iconify |
| 字体 | MiSans、Maple Mono、KaTeX 字体 |
| 部署 | GitHub Actions、GitHub Pages / EdgeOne Pages |

## 快速开始

### 环境要求

- Node.js 22.12.0 或更高版本
- pnpm 9

### 本地运行

```bash
git clone https://github.com/mcxiaochenn/Dusklight.git
cd Dusklight
pnpm install
pnpm dev
```

打开 `http://localhost:4321/` 即可使用仓库内置的演示内容预览站点。

### 构建

```bash
pnpm build
pnpm preview
```

生产构建会依次同步内容、更新追番数据、生成 Astro 静态站点和 Pagefind 中文索引，最终产物位于 `dist/`。

## 配置

站点配置集中在 `src/config/`：

| 文件 | 用途 |
| --- | --- |
| `site.ts` | 站点信息、URL、功能开关、统计与外链行为 |
| `profile.ts` | 个人资料、头像、社交链接与 About 内容 |
| `nav.ts` | 顶部导航与下拉菜单 |
| `comment.ts` | Twikoo 评论配置 |
| `seo.ts` | SEO 默认信息与搜索引擎验证 |
| `resources.ts` | 可替换的运行时第三方 JS/CSS 地址 |
| `theme.ts` | 主题默认值与主题色 |

主要视觉变量位于 `src/styles/tokens.css`。修改强调色、表面层级、间距、字号和圆角 Token，即可统一调整全站视觉。

## 使用独立内容仓库

Dusklight 支持将文章保存在独立仓库中，使主题代码与个人内容分离。复制环境变量模板并填写内容仓库配置：

```bash
cp .env.example .env
```

```dotenv
ENABLE_CONTENT_SYNC=true
CONTENT_REPO_URL=https://github.com/your-name/your-content-repository.git
CONTENT_BRANCH=main
```

未启用同步时，开发与构建流程会继续使用 `src/content/` 中的演示内容。私有仓库可在 CI 中通过具备读取权限的凭据访问，请勿将 Token 提交到版本库。

## 部署

仓库已提供 GitHub Actions 工作流：推送到 `main` 后安装依赖、同步内容、构建站点并发布到 `gh-pages` 分支。当前演示站由 EdgeOne Pages 读取该分支部署。

使用私有内容仓库时，需要在仓库 Secrets 中配置 `CONTENT_REPO_URL`；如需构建期同步 Bilibili 追番数据，可选配置 `BILI_SESSDATA`。

## 项目结构

```text
src/
├── components/     # Astro 组件与 Svelte 交互岛
├── config/         # 站点、导航、资源、评论与主题配置
├── content/        # 内置演示内容
├── data/           # 友链、设备、技能等结构化数据
├── layouts/        # 基础页面与文章布局
├── pages/          # 页面、动态路由与静态 JSON Endpoint
├── plugins/        # Markdown / MDX 渲染插件
├── styles/         # Token、字体、玻璃材质与全局样式
└── utils/          # 外链、加密、文章历史等工具
```

## 常用页面

| 路径 | 内容 |
| --- | --- |
| `/` | 首页文章流、分类栏与侧栏 |
| `/posts/<slug>/` | 文章正文、目录、分享、许可与评论 |
| `/categories/`、`/tags/` | 分类与标签索引 |
| `/archive/` | 文章归档 |
| `/about/` | 关于页面 |
| `/link/` | 友链与朋友圈 |
| `/anime/` | 追番页面 |
| `/timeline/` | 项目开发时间线 |
| `/rss.xml`、`/atom.xml` | RSS 与 Atom 订阅 |

## 致谢与许可

字体与第三方资源的来源、版本和许可信息见 [NOTICE.md](NOTICE.md)。

Dusklight 使用 [MIT License](LICENSE) 开源。使用本项目时，请同时遵守内容、字体、图片及所接入第三方服务各自的许可与使用条款。
