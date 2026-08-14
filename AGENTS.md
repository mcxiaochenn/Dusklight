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
