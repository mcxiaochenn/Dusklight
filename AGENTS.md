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
- UI/正文用 MiSans，代码用 Maple Mono，数学公式保留 KaTeX 字体。禁止将字体切换为远程 CDN。

## 性能与路由维护

- 全局滚动状态只能由一个 passive + `requestAnimationFrame` 调度器更新；进度、位移等视觉变化优先使用 `transform`，禁止在滚动回调中反复读写布局尺寸。
- 新增或修改常驻全屏背景、内容卡片时，禁止使用 `backdrop-filter`、`filter`、`mix-blend-mode`、SVG 噪点等重型合成。玻璃材质仅用于导航、菜单、弹窗等短时覆盖层。
- 启用 `ClientRouter` 时，`window`/`document` 监听器只能在模块顶层绑定一次，事件中查询当前 DOM；页面初始化须幂等，避免换页后累积监听器或闭包。
- 非关键岛屿使用 `client:idle` 或 `client:visible`；外部统计等请求应空闲加载并复用会话缓存。导航预取只标记高频内部入口，不启用全站预取。
- 涉及首屏资源时，必须通过 `pnpm assets:check`；当前预算为单张背景图 ≤ 1 MiB、首页预加载 MiSans ≤ 256 KiB、首页样式总量 ≤ 130 KiB。涉及滚动或路由时，额外验证桌面和移动端连续滚动、连续换页无重复交互或长任务。

## 友链维护

- 新增友链前，先只读查看其公开首页与近期文章标题、分类或标签；不要仅凭站名和简介分类。
- `friendsData` 的 `tags[0]` 决定友链页分组：内容以开发、编程、工具或项目为主归入“技术”；以日常、随笔、生活记录为主归入“生活”。内容混合时按近期多数判断；仍无法判断时先向用户确认。
