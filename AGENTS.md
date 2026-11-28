## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Frontend conventions

- Tailwind CSS 只用 theme/utilities，禁止引入 Preflight 或用 Tailwind 全站重写现有 Astro CSS。
- Svelte 只用于搜索、海报等需要客户端状态的局部交互岛。
- `.astro` / `.svelte` / 客户端 TS/JS 中不得写死运行时第三方 JS/CSS URL，必须通过 `src/config/resources.ts`。npm/Vite import、API 和图片 URL 不在此限制内。
- 图标优先使用 `fa7-solid` / `fa7-regular` / `fa7-brands`；品牌使用 `simple-icons`，两者均没有时才可保留本地图标。
- UI/正文用中文网字计划（`https://chinese-font.netlify.app/zh-cn/`）分包的 **寒蝉全圆体**（Regular + Bold），代码等非中文等宽场景用同站分包的 **Maple Mono CN**（保留本地 `/fonts/maple-mono/` 作兜底），数学公式保留 KaTeX 字体；字体样式入口统一在 `src/config/resources.ts` 中维护。
- 全局版心宽度统一为 `--page-width: 1280px`（`src/styles/tokens.css`）；自定义页与浏览列表页外层使用 `.page-surface` 整体毛玻璃遮罩，防止背景图影响可读性。
- 全局圆角采用苹果几何大 R 角体系（`src/styles/tokens.css` 的 `--radius-*`：`10px / 14px / 22px / 28px`），不使用 `corner-shape: squircle`。
- 首页与文章阅读页共用 `src/components/sidebar/Sidebar.astro`（`ProfileCard` → `Announcement` → `[文章页插槽：粘性 TOC]` → `BoringBay` → `SiteStats` [内含合并的春节倒计时与时间进度条 `Calendar.astro`] → `RecentComments`），禁止在 `BlogPost.astro` 单独维护侧栏卡片清单；文章页 `.article-layout` 保持 `align-items: stretch` 以支撑目录在距导航栏 `20px` 处粘性固定并随文末自然滑离。
- `/about/` 页面头像支持连点 5 次唤醒全局前端调试面板（由 `src/components/common/GlobalScripts.astro` 统一管理实时 FPS HUD、毛玻璃边界高亮与 1280px 版心标尺，支持 `ClientRouter` 跨页持久）。

## 性能与路由维护

- 全局滚动状态只能由一个 passive + `requestAnimationFrame` 调度器更新；进度、位移等视觉变化优先使用 `transform`，禁止在滚动回调中反复读写布局尺寸。
- 新增或修改常驻全屏背景时，禁止在背景图层上使用重型 `filter`、`mix-blend-mode`、SVG 噪点或过厚的不透明遮罩挡住透光纹理；移动端（`≤768px`）不得加载站点背景图。全站玻璃材质（导航、弹窗、文章主体、内容卡片、侧边栏）统一复用 `src/styles/tokens.css` 的 `--glass-*` 令牌与 `.glass-panel` 分层景深体系（基础层 `saturate(180%) blur(8px)`，深色底 `#1e1e1e99` + `#42444a` 细边框；下拉菜单层 `blur(16px)`；弹窗与遮罩层 `blur(20px)`），禁止组件私自硬编码脱离令牌的玻璃参数。
- 启用 `ClientRouter` 时，`window`/`document` 监听器只能在模块顶层绑定一次，事件中查询当前 DOM；页面初始化须幂等，避免换页后累积监听器或闭包。
- 非关键岛屿使用 `client:idle` 或 `client:visible`；外部统计等请求应空闲加载并复用会话缓存。导航预取只标记高频内部入口，不启用全站预取。
- 涉及首屏资源时，必须通过 `pnpm assets:check`；当前预算为单张背景图 ≤ 1 MiB、首页本地样式总量 ≤ 130 KiB，并校验中文网字计划样式已挂载。涉及滚动或路由时，额外验证桌面和移动端连续滚动、连续换页无重复交互或长任务。

## 友链维护

- 新增友链前，先只读查看其公开首页与近期文章标题、分类或标签；不要仅凭站名和简介分类。
- `friendsData` 的 `tags[0]` 决定友链页分组：内容以开发、编程、工具或项目为主归入“技术”；以日常、随笔、生活记录为主归入“生活”。内容混合时按近期多数判断；仍无法判断时先向用户确认。
