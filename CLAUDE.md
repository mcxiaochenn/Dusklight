# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:4321)
pnpm build            # sync-content (fail-soft) → update-anime → astro build → postbuild (obfuscate-anti-mirror)
pnpm preview          # Preview production build
pnpm sync-content     # Manually sync content repository
pnpm update-anime     # Fetch Bilibili 追番 → src/data/bilibili-data.json (gitignored)
```

**Package manager**: pnpm (not npm/yarn). Lockfile is `pnpm-lock.yaml`.
**Node requirement**: `>=22.12.0`

**Background dev server** (from `AGENTS.md`): `astro dev --background`, managed with `astro dev stop` / `astro dev status` / `astro dev logs`.

**After editing `.astro` or CSS files**: rebuild and visually verify. Astro caches aggressively in `.astro/` — if changes don't appear, delete `.astro/` and `dist/` before rebuilding.

**Content sync**: `pnpm dev` and `pnpm build` automatically run `scripts/sync-content.js` via `predev`/`prebuild` hooks. This clones/updates the private content repository into `./content/` (gitignored). No symlinks — `src/content.config.ts` reads `content/blog/` directly when it exists. If no `.env` exists, the sync is skipped and the built-in demo content in `src/content/` is used.

**Deployment**: GitHub Actions builds, then pushes `dist/` to the `gh-pages` branch. EdgeOne Pages imports from that branch and serves `blog.mcxiaochen.top` (Site URL is `https://blog.mcxiaochen.top`, `base` unset so links are root-relative). Mermaid diagrams render client-side (see the Remark/Rehype section), so no Playwright/browser is needed at build time.

**No test or lint tooling exists.** `package.json` defines no `test`/`lint`/`format` script, and there is no ESLint / Prettier / Biome config in the repo. Verification means `pnpm build` completes + visual check in the browser. Do not invent or assume a test command.

## Architecture

This is an **Astro 7.x** static blog site with **no runtime JS framework** (no React/Vue/Svelte). All components are `.astro` files with scoped `<style>` blocks and vanilla `<script>`. The homepage sidebar calendar is pure Astro + vanilla JS, with day/month/year views and a compact annual 12×5 month-week heatmap (columns = months; rows = days 1–7, 8–14, 15–21, 22–28, 29–month end). Heatmap cells are square and the matrix is capped at 260px so the stacked 960px sidebar does not inflate it. Its layout and interactions are an equivalent reimplementation of Luquiescene's `calendar-widget`, styled with Dusklight tokens rather than copied Svelte code. The script is a plain `<script data-astro-rerun>` — **NOT `is:inline`**: the script is full of JS object literals that Astro's `{}` expression parsing would break. It uses event delegation on the root node, a `dataset.init` re-entry guard, fetches `/api/calendar-data.json`, and re-runs after every View Transition; the `astro:before-swap` cleanup clears its midnight timer and detached tooltip before the old DOM is replaced. Runtime-created calendar nodes copy the root's `data-astro-cid-*` attribute so scoped styles remain active after ClientRouter round trips—using `:global()` for those nodes loses their styles when returning to the homepage.

### Design System

The entire visual identity is driven by **CSS custom properties** in `src/styles/tokens.css`:

- **Single hue system**: `--hue: 170` (oklch color space) drives the entire palette — change one value, everything shifts
- **Layered surfaces**: `--surface-0` (deepest) through `--surface-3` (highest)
- **Liquid glass**: `--glass-bg`, `--glass-border`, `--glass-blur` etc. — used by Header pills, BackToTop, TOC panel
- **Three-tier text**: `--foreground` / `--foreground-secondary` / `--foreground-muted`
- **连续曲率圆角**：所有现有 `border-radius` 都是兼容性基线；支持的浏览器通过零特异性全局规则应用 `corner-shape: var(--corner-shape, var(--corner-shape-continuous))`。头像、状态点、加载环等真圆使用 `--corner-shape: var(--corner-shape-round)` 退出。不要改用 SVG mask、Houdini polyfill 或尺寸监听 JavaScript，它们会破坏玻璃背景/阴影或增加生命周期负担。

**Dark mode**: `.dark` class on `<html>` overrides tokens. Anti-flash inline script in ThemeToggle restores theme before first paint.

### Liquid Glass Pattern

The Header pill uses a specific `::before` pseudo-element pattern for the glass effect:

```css
.element::before {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation)) brightness(var(--glass-brightness));
  box-shadow: var(--glass-highlight);
  z-index: -1;
}
```

**Critical — what backdrop-filter can see**: the fixed SiteBackdrop photo sits behind *everything*, so glass works on floating chrome (Header pill, BackToTop, TOC) **and** on in-flow frosted panels (PostCard, code frames, admonitions) — anywhere the photo shows through. Body text stays bare on the backdrop, no glass. Two hard-won constraints: **(1)** the backdrop image is pre-blurred `blur(8px)` in SiteBackdrop, so `--glass-blur` below ~16px is visually a no-op (blurring a blur) — the token's 24px baseline exists because a past 12px value made all glass "disappear"; **(2)** translucency over the photo costs syntax/text contrast in measurable ways — see the Expressive Code section before touching `--code-bg` alpha.

**Glass coverage**: the mobile menu drawer (`Header.astro` `.mobile-menu__panel`) uses an **opaque-er** glass than the 0.45/0.55 baseline — it slides over a dark backdrop layer, so the normal glass alpha would blur into a readable-less smear. It uses ~0.85 alpha + `blur(1.5× glass-blur)` in both themes. Anime card covers use the standard glass as a pre-load placeholder.

### Content Sync Architecture

Blog content lives in a **separate private repository** (`mcxiaochenn/Dusklight-Content` — framework is open-source, articles are not). The sync script (`scripts/sync-content.js`) only clones/updates that repo into `./content/` (gitignored). Content pickup happens in `src/content.config.ts`:

```ts
const synced = existsSync("./content/blog/posts");
// collections read from content/blog/{posts,spec} when present,
// else from the built-in demo content in src/content/{posts,spec}
```

**Deliberately NO symlinks/junctions**: on Windows, git traverses junctions and recurses into their contents — a junction at `src/content` would surface every private article as untracked files in the framework repo's working tree, one careless `git add .` away from publishing them. The `existsSync` switch keeps private content entirely outside the framework's tracked tree. (The old junction-based sync also had a copy-fallback staleness gotcha; both are gone.)

Content repo layout: `blog/posts/**` (articles, `年/月/序号.标题.md`) + `blog/spec/*` (about/envelope/sponsors/friends). Configuration via `.env` (see `.env.example`). When `ENABLE_CONTENT_SYNC` is not `true`, sync is skipped; whether real content is used depends only on `content/blog/` existing. The content repo can trigger framework rebuilds via GitHub Actions `repository_dispatch`. **spec 死文件**:about 页内容已迁入框架 `profileConfig.aboutCards`,spec/about.md 不再被渲染;sponsors 页已删除,spec/sponsors.md 同样无人消费(保留在内容仓库仅为历史)。

**Editing content-repo files: commit + push in `content/` FIRST, then build.** The prebuild sync runs `git stash + git reset --hard origin/main` inside `content/` — any uncommitted edit there is silently discarded by the next `pnpm dev`/`pnpm build` (this actually happened; the edit survived only in `git stash`). `sync-content.js` reads `.env` first and falls back to `process.env` — CI passes `CONTENT_REPO_URL` via workflow `env:` (for the private repo the secret must embed a PAT: `https://<PAT>@github.com/...`).

### Self-Hosted Libraries

All third-party browser-side libraries are self-hosted (no CDN requests except friend avatars and self-hosted Umami analytics):

| Path | Library | Used by |
|------|---------|---------|
| `public/vendor/mermaid.min.js` | Mermaid 11.x | `mermaid-render-script.js` (client-side dynamic render) |
| `public/vendor/fclite.min.css` | Friend-Circle-Lite | `Friend-Circle-Lite.astro` |
| `public/vendor/fclite.min.js` | Friend-Circle-Lite | `Friend-Circle-Lite.astro` |
| `public/js/twikoo.min.js` | Twikoo 1.7.15 | `TwikooComments.astro` (dynamic script injection) |

KaTeX CSS/JS is bundled at build time by `rehype-katex` (npm), not loaded from a CDN. The `src/config/cdn.ts` file is an empty placeholder kept for barrel-export compatibility.

**abbrlink fidelity**: all 31 migrated posts carry `abbrlink` in frontmatter (30 legacy values preserved verbatim from the live site; one computed with Mizuki's exact CRC-32 rule `"p" + (CRC32(path) >>> 0).toString(36)`, validated against 3 known pairs). Never regenerate or edit a published abbrlink — it is the URL, and Twikoo threads key on it.

### Anti-Mirror System

The site includes a build-time anti-mirror mechanism to redirect visitors on unauthorized domains:

- `src/components/common/AntiMirror.astro` — inline `<script>` injected in `<head>` that checks `location.hostname` against the canonical domain
- `scripts/obfuscate-anti-mirror.js` — runs as `postbuild`, obfuscates the anti-mirror script in `dist/` with random variable names to deter bypassing
- Controlled by `siteConfig.antiMirror.enabled` in `src/config/site.ts`

### Encrypted Posts

Articles can be password-encrypted via frontmatter (`password`, `hint` fields). The `Encryptor.astro` component renders a password prompt and decrypts content client-side using `src/utils/crypto-utils.ts`. Encrypted posts use a separate stylesheet (`src/styles/encrypted-content.css`).

### Twikoo Comments (Self-Hosted 1.7.15)

Twikoo is loaded from `public/js/twikoo.min.js` (standard build, not the Tencent-Cloud-only `.all` variant). The loading architecture handles three concerns:

**Dynamic script injection** (`TwikooComments.astro`):
- Creates a `<script>` tag pointing to `/js/twikoo.min.js` on first load
- On View Transitions navigation, re-runs `initTwikoo()` without re-creating the script tag
- Theme change detection via `MutationObserver` on `<html>` class → `twikoo.setTheme()`

**Style overrides** (`src/styles/twikoo.css`, ~750 lines):
- All selectors use `#twikoo` prefix (specificity 1,0,0) to beat Twikoo's built-in `.twikoo` (0,1,0)
- Element UI inline styles (`.el-textarea__inner`, `.el-input__inner`) are patched via JS `setProperty(..., "important")` — CSS alone cannot override them
- Full glass-card treatment: comments, submit area, tags, code blocks all use `--glass-bg` + `backdrop-filter`
- Action button icon swap on hover/liked/disliked (`.tk-action-icon` ↔ `.tk-action-icon-solid`)
- Dark mode: shadows only via `:root.dark`; colors auto-switch through design tokens
- `@media (prefers-reduced-transparency)` fallback for accessibility

**View Transitions compatibility**:
- Both `DOMContentLoaded` and `astro:page-load` trigger `loadTwikoo()`
- `injectOverrides()` re-runs after each init (5s MutationObserver window) to catch Element UI's delayed DOM injection
- The `twikoo` global persists across navigations; only re-initialization is needed

### Remark/Rehype Plugin Architecture

Custom markdown plugins live in `src/plugins/` (not in `node_modules`). These are **project-specific transforms**, not third-party packages:

| Plugin | Purpose |
|---|---|
| `remark-content.mjs` | Injects `excerpt`, `minutes` (reading time), `words` into frontmatter. CJK-aware: Latin counted at 200 wpm, CJK characters at 400 cpm |
| `remark-pangu.mjs` | Inserts whitespace between CJK and Western characters at build time (`pangu.spacingText` on mdast text nodes). Runs before `remarkContent` so excerpts/word counts see the corrected text. Also contains a directive-head repair pass: pangu would insert a space into `:::note[标题]` → `:::note [标题]` and break directive parsing, so the plugin reverts that one space |
| `remark-mermaid.js` | Extracts Mermaid code blocks for build-time rendering |
| `remark-fix-github-admonitions.js` | Normalizes GitHub-style `> [!NOTE]` syntax |
| `remark-directive-rehype.js` | Bridges remark-directive to rehype custom components |
| `remark-escape-numeric-colons.mjs` | Fixes colon parsing in certain contexts |
| `rehype-mermaid.mjs` | Injects the client-side Mermaid render script into code block containers (diagrams render in the browser at runtime) |
| `rehype-wrap-table.mjs` | Wraps `<table>` in scrollable container |
| `rehype-image-width.mjs` | Injects intrinsic image dimensions |
| `rehype-component-admonition.mjs` | Custom admonition component (`:::note`, `:::tip`, etc.) |
| `rehype-component-github-card.mjs` | `<github repo="owner/repo">` embed cards |
| `rehype-component-image-grid.mjs` | `<grid>` image grid layout |
| `mermaid-render-script.js` | Client-side runtime script for dynamic Mermaid rendering with zoom, pan, and fullscreen overlay (injected by `rehype-mermaid.mjs`) |
| `expressive-code/language-badge.ts` | Expressive Code plugin — language badge on code block frames (registered) |

**Mermaid rendering** is fully client-side: `rehype-mermaid.mjs` injects `mermaid-render-script.js` into the page, and the browser renders diagrams at runtime. No Playwright/browser is needed at build time (the old "requires Playwright" note and the CI install step have been removed).

### Import Aliases

`@/` maps to `src/` — configured in both `astro.config.mjs` (Vite resolve alias) and `tsconfig.json` (path mapping). Use `@/config`, `@/components`, etc. in imports.

### Markdown Pipeline

Configured in `astro.config.mjs`:
- **remark-math** → parse `$...$` and `$$...$$` math expressions
- **rehype-katex** → render math with KaTeX (CSS bundled at build time, no CDN)
- **rehype-slug** → add `id` attributes to headings
- **rehype-autolink-headings** → wrap headings in anchor links
- **rehype-external-links** → open external links in new tab with `noopener noreferrer`
- **remark-directive** + `parseDirectiveNode` + **rehype-components** → the `:::note` / `<github>` / `<grid>` custom components
- **remark-sectionize** → wraps heading-delimited content in `<section>` elements

### Code Blocks — Expressive Code (not Shiki)

Syntax highlighting is handled by the **`astro-expressive-code`** integration configured in `astro.config.mjs`, not by Astro's built-in Shiki config. Editing `markdown.shikiConfig` will do nothing.

- Dual themes: `github-light` / `github-dark`
- **Theme selection is keyed to the site's `.dark` class, NOT the OS.** `astro.config.mjs` sets `useDarkModeMediaQuery: false` + `themeCssSelector: (theme) => theme.type === "dark" ? ".dark" : ".light"`. EC's default emits an `@media (prefers-color-scheme: dark)` rule, which follows the **OS** preference — but this site's 3-way toggle lets the site theme disagree with the OS. Under the default, OS-dark + site-light rendered github-dark's near-white punctuation (`#E1E4E8`) on the near-white `--code-bg` (invisible), and OS-light + site-dark rendered dark-on-dark. The `.light` selector never matches in `auto` mode (root gets `auto` [+ `dark`], never `light`) — that is fine: no rule fires and the base theme (github-light) applies. Verified with a 6-combo OS×site matrix.
- Official plugins: `pluginCollapsibleSections`, `pluginLineNumbers`
- Project plugin: `src/plugins/expressive-code/language-badge.ts` (registered)
- `styleOverrides` deliberately point at design tokens (`var(--radius-lg)`, `var(--surface-1)`, `var(--font-mono)`) so code blocks track the theme
- **Code frames are frosted glass: `--code-bg` = surface-1 tone at 85 % alpha + `backdrop-filter: blur(var(--glass-blur))` on `.frame`.** The alpha is a measured balance, not taste. `github-light` / `github-dark` are palettes tuned for a fixed canvas (`#FFFFFF` / `#0D1117`); whatever the photo contributes through the translucency shifts that canvas. Audited on the real backdrop images across 784 syntax fragments: at the old `--glass-bg` alpha (.55/.45), **0 %** of light-mode fragments met WCAG AA (contrast swung up to 10.2 with the photo) and dark mode fell to 82.9 % (a bright-green backdrop region tinted the frame). At 85 % + deep blur: light 96.2 % vs a 97.3 % palette ceiling, dark 99.0 % vs 99.2 % — the owner's explicit call ("更深的模糊提高可读性，而不是直接删除") trading ≤1 pp of AA for the frosted material. Those audit figures composite over *unblurred* image extremes, so they are conservative upper bounds on drift. Do not lower the alpha back toward .55, and do not remove the blur — each guards the other.
- **Frame chrome (tab bar, terminal titlebar) is tokenized in `astro.config.mjs` `styleOverrides.frames`.** Without those overrides, EC emits the GitHub themes' literal chrome colors — `#f6f8fa` tab bar, `#fff` active tab, an **orange** active-tab indicator `#f9826c` — which ignore `--hue` and clash with the site's teal accent. The overrides map: tab bar / titlebar → `--surface-2`, active tab → `--code-bg`, active-tab indicator → `--accent`, separators → `--border-subtle`, dots → `--foreground-muted`. One value serves both themes because the tokens themselves flip under `.dark`.
- Extra visual tuning lives in `src/styles/expressive-code.css`, imported by `BlogPost.astro`
- The **copy button is Expressive Code's built-in one** — the old hand-rolled copy script was removed from `GlobalScripts.astro`

### Component Architecture

```
src/components/
├── common/     # Header, Footer, ThemeToggle, BackToTop, ScrollProgress, SiteBackdrop, GlobalScripts, AntiMirror
├── blog/       # PostCard, PostCardList, ArticleMeta, TOC, TwikooComments, Encryptor
├── seo/        # SEOHead (meta/OG/canonical), JsonLd
├── sidebar/    # Sidebar, ProfileCard, Announcement, SiteStats, Calendar, BoringBay
└── ui/         # Button, Tag, Divider, Card, CodeBlock, Blockquote, Pagination
```

- **BaseLayout.astro** — wraps every page: `SEOHead` + `AntiMirror` + `ClientRouter` in `<head>`, then skip-link + SiteBackdrop + Header + `<slot />` + Footer + ScrollProgress + BackToTop + GlobalScripts
- **GlobalScripts.astro** — the shared client-side JS: image lightbox, back-to-top visibility, scroll reveal (`IntersectionObserver` on `.reveal`). Runs `initAll()` on `DOMContentLoaded`, `astro:page-load`, and Vite HMR `vite:afterUpdate`. Code block copy is **no longer here** — Expressive Code owns it.
- **SiteBackdrop.astro** — lazy-loads background images after `window.load`, swaps them via a MutationObserver on `<html>` class changes. Image paths are hardcoded (`/images/bg/xiowo-bg-{light,dark}.webp`); light mode is dimmed with `filter: blur(8px) brightness(0.75)`.

**View Transitions are enabled site-wide** — `<ClientRouter />` sits in `BaseLayout`'s `<head>`. This is *why* every piece of client JS must re-initialize on `astro:page-load`: the browser never does a full document load after the first navigation, so `DOMContentLoaded` fires only once.

### Content Collections

Defined in `src/content.config.ts`:

- **`blog`**: `src/content/posts/` — typed frontmatter:
  - `title` (string, required)
  - `date` (date, required) — preferred format: `yyyy/mm/dd hh:mm:ss`
  - `updated` (date, optional) — falls back to `date` at render time
  - `description` (string, required)
  - `tags` (string[], default `[]`)
  - `category` (string, optional)
  - `cover` (string, optional) — **must be a public absolute path (`/images/…`) or full URL.** The schema is a plain `z.string()` (not Astro's `image()` helper), so the value lands verbatim in `<img src>` with zero processing — a relative path like `./cover.jpeg` 404s on every page because the file is never emitted to `dist/`. (Relative images in the markdown *body* are fine — those go through Astro's asset pipeline.)
  - `pinned` (boolean, default `false`)
  - `author` (string, optional)
  - `draft` (boolean, default `false`)
  - `abbrlink` (string, optional)
  - `comment` (boolean, default `true`) — hidden, always-on unless explicitly set
  - `toc` (boolean, default `true`) — hidden, always-on unless explicitly set
  - `password` (string, optional) — presence turns the post into an encrypted post
  - `hint` (string, optional) — password hint shown by `Encryptor`
- **`spec`**: `src/content/spec/` — untyped markdown pages (about.md, etc.) rendered via `getEntry()` + `render()`。注意 about.astro 已不渲染 spec/about.md：关于页内容结构化在 `profileConfig.aboutCards`（关于我/当前系统/我的域名/关于本站），spec/about.md 在内容仓库里是死文件

### Remark-Injected Frontmatter (excerpt / reading time)

`remark-content.mjs` computes `excerpt`, `minutes`, and `words` during markdown compilation, so these values **do not exist on `post.data`** — they live in the render output. There are two different access paths in this codebase, and which one you need depends on whether you have rendered the post:

- `src/pages/posts/[...slug].astro` reads them off the already-rendered entry: `post.rendered?.metadata?.frontmatter`
- `src/pages/[...page].astro` cannot — so it `await render(post)` for **every** post inside `getStaticPaths` purely to collect excerpts, then passes them down as a `props.excerpts` map keyed by `post.id`

Excerpt source: text before a `<!-- more -->` HTML comment if present, otherwise the first non-empty paragraph. Code blocks are excluded from both excerpt and word count.

### Routing & Pagination

| Route file | URL(s) |
|---|---|
| `src/pages/[...page].astro` | `/` and `/2/`, `/3/`… (verified in `dist/`) — **this is the homepage**; there is no `index.astro`. Hero is 左文右卡 (title + gradient category buttons + 「随便逛逛」random link \| featured-post cover card). The main grid places `TaxonomyBar` directly above the left post stream and top-aligns it with the right `ProfileCard`; the remaining sidebar order is announcement/site-stats/calendar/boringbay. Stats are computed in `getStaticPaths`. |
| `src/pages/posts/[...slug].astro` | `/posts/<abbrlink 或 post.id>/` — see Post URLs below |
| `src/pages/tags/index.astro`, `tags/[tag].astro` | tag index + per-tag listing |
| `src/pages/categories/index.astro`, `categories/[category].astro` | 分类索引 + 分类文章列表（nav「文库」下拉的「分类列表」入口） |
| `src/pages/archive.astro`, `about.astro`, `404.astro` | static pages — archive 显示名「全部文章」（nav「文库」下拉入口） |
| `src/pages/envelope.astro`, `link.astro` | 留言板 / 友链 — URLs match the live site verbatim so Twikoo threads survive; each embeds `TwikooComments`（`/sponsors/` 已并入 about 的「致谢」卡片并删除页面） |
| `src/pages/devices.astro`, `skills.astro` | data-driven pages from `src/data/{devices,skills}.ts` |
| `src/pages/anime.astro` | `/anime/` — reads gitignored `src/data/bilibili-data.json` fetched by `scripts/update-anime.mjs` in the build chain; empty-state when missing |
| `src/pages/timeline.astro` | `/timeline/` — 显示名「更新日志」，build-time `git log` grouped by month (CI needs `fetch-depth: 0`) |
| `src/pages/Friend-Circle-Lite.astro` | `/Friend-Circle-Lite/` (case-sensitive, matches live) — external fclite JS/CSS + `fc.mcxiaochen.top`。**初始化坑**:fclite.min.js 只在加载时初始化一次、重初始化仅监听 `pjax:complete`;本站是 Astro View Transitions(`astro:page-load`),所以页面显式在 `astro:page-load` + `DOMContentLoaded` 重置 `window.UserConfig` 并调全局 `initialize_fc_lite()`。link.astro 的朋友圈摘要同理(纯 IIFE 在导航时序会静默跳过,已改事件驱动 + dataset 防重入) |
| `src/pages/rss.xml.js` | RSS feed endpoint |

**Data files (`src/data/`)**: friends/devices/skills/sponsors are self-contained TS (interface + data in one file), committed to the framework repo (they were already public in the old blog repo). `bilibili-data.json` is the one exception — build-fetched and gitignored. `skills.ts` still holds theme template sample data (as does the live site).

Pagination uses Astro's built-in `paginate()` helper with `pageSize: siteConfig.postsPerPage` (currently 8). The shared `ui/Pagination.astro` renders from `page.currentPage` / `page.lastPage` / `page.url.prev` / `page.url.next`.

**Prefetch**: `astro.config.mjs` sets `prefetch: { prefetchAll: true, defaultStrategy: "hover" }` — every internal link prefetches on hover.

### Post URLs (abbrlink)

**Never hand-build a post URL.** `src/utils/abbrlink.ts` owns the rule and every link goes through it:

- `getPostSlug(post)` → `post.data.abbrlink?.trim() || post.id`
- `getPostUrl(post)` → `/posts/${getPostSlug(post)}/`

Callers: `pages/posts/[...slug].astro` (via `getStaticPaths`), `PostCard`, `PostCardList`, `archive.astro`, `rss.xml.js`. Canonical/OG URLs need no wiring — `SEOHead` derives them from `Astro.url.pathname`.

The `/posts/` prefix and the abbrlink-else-filename rule both **match the existing live blog exactly** (`/posts/p6eae1621/` alongside `/posts/mi-unlock-713/`). That is the point: same URLs means inbound links, search rankings, and **Twikoo comment threads all survive the migration** — `TwikooComments.astro` passes no explicit `path`, so Twikoo keys threads on `location.pathname`. Changing the URL shape orphans every existing comment.

`generateAbbrlink()` in the same file computes `md5(title + date)` and is **deliberately not wired into routing** — its output would not match the abbrlinks already published on the live site. abbrlink values come only from frontmatter.

### Theme Switching

ThemeToggle cycles **light → dark → auto** (3 modes, not 2). The animation is a **circular reveal built on the native View Transitions API** — the new theme wipes in from the button, and the old theme stays put underneath:

1. Stashes the click origin and a cover-the-farthest-corner radius on `:root` as `--theme-switch-x/y/r`, plus a `data-theme-switching` attribute
2. Calls `document.startViewTransition(() => applyTheme(next))` — the browser snapshots before/after
3. CSS animates `clip-path` on `::view-transition-new(root)` from `circle(0)` to `circle(--theme-switch-r)` over `--duration-slow`
4. `transition.finished` clears the attribute, the coordinate vars, and the `animating` flag

Three things about the CSS that are load-bearing, all in ThemeToggle's **`<style is:global>`** block:

- **It must be `is:global`.** `::view-transition-*` is a pseudo-element tree on the document root; Astro's scoping would append `data-astro-cid-*` and the selectors would never match.
- **It must be gated on `:root[data-theme-switching]`.** `<ClientRouter />` generates the same pseudo-elements on every page navigation — ungated, every page transition would inherit the circular wipe using stale coordinates.
- **`isolation: auto` on `::view-transition-image-pair(root)` plus `mix-blend-mode: normal`** — the UA default is `plus-lighter` for cross-fading, which would add the two themes' colours together instead of showing one over the other.

The cycle uses **`getStored()`, not `getEffective()`** — and it must. `getEffective()` resolves `auto` to light/dark, so using it would make `auto` unreachable and collapse the 3-way cycle into a 2-way one.

Guards worth preserving: an `animating` flag rejects re-entry mid-transition, and the JS short-circuits to a plain `applyTheme()` when `prefers-reduced-motion` is set **or** `document.startViewTransition` is missing (Firefox). The reduced-motion check cannot live in CSS — a `@media` block only shortens transitions, it cannot cancel the `animation` on `::view-transition-new(root)`.

### Navigation

`src/config/nav.ts` supports nested dropdowns via `children?: NavItem[]`. Header renders desktop dropdowns with hover + click toggle, mobile as grouped sections. Current structure: **文库**(全部文章/分类列表/标签列表)、**友链**(友链列表/友链朋友圈)、**关于**(我的追番/设备/更新日志/关于本站)、**外链**(开往/Umami/AI 提示词生成器)。技术栈与赞助已从导航移除(技能入口在 about 页技能墙,赞助并入 about「致谢」卡)。注意 nav 顶层 label 变更需同步 `Header.astro` 的 `navIcons` 映射(如「归档」→「文库」用了 `ph:books`)。

## Design Reference

`DESIGN.md` is a comprehensive design constitution documenting the visual philosophy, layout principles, typography rules, color system, motion system, glass specifications, component architecture, and responsive strategy. **Important caveat**: it was written as a planning document and some values diverge from the actual implementation (e.g., it specifies `--hue: 250` while `tokens.css` uses `--hue: 170`; the homepage hero is now a 左文右卡 asymmetric layout — title + gradient category buttons + 「随便逛逛」on the left, a featured-post cover card on the right). When in doubt, **`tokens.css` and the actual `.astro` components are the source of truth**, not `DESIGN.md`.

## Key Configuration Files

| File | Purpose |
|------|---------|
| `src/config/site.ts` | Site title, description, postsPerPage, feature toggles |
| `src/config/profile.ts` | Name, avatar, bio, location, MBTI, socials, skills, intro |
| `src/config/mottos.ts` | 随机语录池 + 时间问候表（ProfileCard 问候语胶囊点击随机更换） |
| `src/config/nav.ts` | Navigation menu structure + social links |
| `src/config/comment.ts` | Twikoo comment system envId |
| `src/config/cdn.ts` | ⚠️ Now an empty placeholder — all third-party libraries are self-hosted (see Self-Hosted Libraries below). Kept for barrel export compatibility |
| `src/config/seo.ts` | SEO defaults, JSON-LD, search engine verification |
| `src/config/theme.ts` | ⚠️ Exported but **consumed by nothing** — see Gotchas. Real values live in `tokens.css` |
| `src/config/index.ts` | Barrel export for all config modules |

All config is re-exported from `src/config/index.ts` — import via `import { siteConfig, themeConfig } from "@/config"`.

**`profile.ts` 的 about 数据结构**(about.astro 消费,布局为 **anheyu 主题魔改版**,蓝本 `Temp/hexo-theme-anzhiyu/layout/includes/page/about.pug` + `source/css/_page/about.styl`):
- `favorites`: `{name, image, landscape?}[]` — 番剧图是 MAL 外链(竖版),游戏图已下载到 `public/images/favorites/` 转 webp 入库;`landscape: true` 的横版图用 16:9 横卡,否则 3:4 竖卡
- `personalityImage`: INTP-T 立绘(`/images/intp.svg`,16Personalities 官方,下载入库)
- `aboutCards`: 原 spec/about.md 内容结构化(关于我/当前系统/我的域名/关于本站)
- `authorTagsLeft/Right`: author-box 头像两侧漂浮标签
- `hello`/`helloName`: 问候渐变卡文字
- `aboutsiteTips`: `{tips, title1, title2, words[]}` 关键词遮罩轮播(JS 在 about.astro `initTipsCarousel`)
- `selfInfo`: `{label, value}[]` 数据行(出生年份/现居/身份)
- `skillsTitle`/`skillsTips`: 技能卡标题
- 布局为 59/39 不等宽卡片行,含斜切封面墙(`.about-comic-item` hover 展开)、性格立绘 hover 旋转、致谢 reward 卡

**Note**: `src/consts.ts` exists but is a leftover from the Astro starter template. The actual site constants are in `src/config/site.ts`.

## Styling Conventions

- All CSS uses design tokens from `tokens.css` — no magic numbers
- Components use scoped `<style>` blocks (Astro auto-scopes with `data-astro-cid-*`)
- Global styles in `src/styles/` are imported via `global.css` (tokens → reset → base → typography → glass → animations → utilities)
- **Three stylesheets are deliberately outside that chain** and are imported by the component that needs them, so they don't ship on every page: `expressive-code.css` + `encrypted-content.css` (imported by `layouts/BlogPost.astro`) and `twikoo.css` (imported by `blog/TwikooComments.astro`)
- `.prose` class in `typography.css` handles all long-form content typography
- Responsive: `@media (max-width: 768px)` and `@media (max-width: 640px)` breakpoints

## CI/CD

`.github/workflows/deploy.yml` handles deployment:
- Triggers on push to `main` and `repository_dispatch` (content repo updates)
- Installs pnpm 9, Node 22
- Runs `pnpm sync-content` to fetch content, then `pnpm build`
- Pushes `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages` (`force_orphan: true`); EdgeOne Pages deploys that branch to `blog.mcxiaochen.top`. The workflow needs `permissions: contents: write` for the branch push — do NOT change it back to Pages-API style (`pages: write`/`id-token: write` + `deploy-pages`) unless the hosting model actually switches to GitHub Pages.

**`pnpm-workspace.yaml` 的 `packages: ['.']` 字段不能删。** 2026-07 曾因缺失该字段导致 CI 全挂:更新后的 pnpm 9 在 `actions/setup-node` 的 `cache: pnpm` 步骤(内部执行 `pnpm store path`)报 `packages field missing or empty`,构建从未越过 Setup Node。同文件里的 `allowBuilds` 是 **pnpm 10 专用字段**(放行 esbuild/sharp 构建脚本)——本地开发是 pnpm 10 靠它生效,而 CI 装 pnpm 9 会静默忽略它(pnpm 9 默认放行所有构建脚本)。这是刻意的版本漂移,不要顺手统一,除非同时验证两边。

`.github/content-repo-trigger.yml` is a template to copy into the content repo — it sends `repository_dispatch` events when content changes.

## Conventions

- **Keep CLAUDE.md current**: Any code change that alters architecture, behavior, dependencies, or tooling MUST update CLAUDE.md in the same commit. If you spot a stale description while working, correct it — never leave misleading documentation. (Past stale notes that misled: "Mermaid requires Playwright", "lightningcss rejects oklch(from ...)".)
- **Commit messages**: Use standard [Conventional Commits](https://www.conventionalcommits.org/) format — `feat:`, `fix:`, `docs:`, `refactor:`, etc. No custom prefixes like `@`.
- **No auto-push**: Never `git push` unless the user explicitly asks. Commit locally only.
- **Confirm before coding**: After receiving a new task, restate your understanding back to the user before writing any code. Avoid cognitive bias — if the interpretation is wrong, the user will correct you before you waste effort.
- **No emoji in code**: Never use emoji characters (✅❌📋⚠️📌📡🛠️📝🔗📖📜🌐) in `.astro`, `.html`, `.css`, or `.js` files. Use SVG icons via `<Icon name="ph:icon-name" />` (astro-icon + Phosphor) or inline SVG instead. This avoids rendering inconsistencies across platforms and keeps the icon system unified.

## Gotchas

- **Build cache**: If CSS changes don't appear, delete `.astro/` and `dist/` before rebuilding.
- **`backdrop-filter` MUST be declared with `-webkit-backdrop-filter` FIRST and the standard property LAST.** The production CSS minifier treats the pair as duplicates of one property and keeps only the **last** declaration. With the standard-first order this codebase used to have, every built stylesheet shipped *only* `-webkit-backdrop-filter` — which Chromium/Firefox ignore — so **all glass blur was silently dead in `pnpm build`/`preview` while looking perfectly fine in `astro dev`** (dev serves unminified CSS with both declarations). The discrepancy is invisible to computed-style checks in dev and to screenshot checks over the pre-blurred wallpaper; the reliable probes are: `getComputedStyle(el).backdropFilter` on a **built** page (was `none`), and grepping the built output: `grep -oh '[{;]backdrop-filter:' dist/_astro/*.css` (a bare-substring grep matches inside `-webkit-…` and lies). Current order (prefix first) makes the minifier keep the standard property; pre-18 Safari degrades to translucency without blur, which is acceptable.
- **CSS minification uses esbuild, not lightningcss.** `astro.config.mjs` sets no `build.cssMinify`, so Astro falls back to Vite's default esbuild minifier — `oklch(from var(--x) l c h / alpha)` relative color syntax is preserved verbatim in the built CSS (verified in `dist/_astro/*.css`; the site uses it in 20+ places). An older note claimed lightningcss would fail on this syntax — that only applies if `build.cssMinify` is ever switched to `"lightningcss"`. Note: `var(--token / 0.5)` shorthand is invalid CSS regardless; use `color-mix(in oklch, var(--token) 50%, transparent)`.
- **`node_modules/.astro/` is a THIRD cache, and `rm -rf .astro dist` does not touch it.** Its `data-store.json` holds the *rendered HTML* of every content entry — including the `<link rel="stylesheet" href="/_astro/ec.<hash>.css">` that `astro-expressive-code` injects into the rendered markdown AST. The hash is content-derived, so whenever EC's generated CSS changes but the markdown does not, the cached HTML keeps pointing at the **old** hash while the build emits the **new** file. Result: every page requests a stylesheet that 404s, all syntax highlighting silently dies, and code renders flat in `--foreground`. This actually shipped and was mistaken for a contrast bug. Diagnose with:
  ```bash
  echo "ref: $(grep -o 'ec\.[a-z0-9]*\.css' dist/posts/<any>/index.html | head -1)"
  echo "got: $(ls dist/_astro/ | grep -o 'ec\.[a-z0-9]*\.css')"
  ```
  If they differ, `rm -rf node_modules/.astro .astro dist && pnpm build`. CI is immune (fresh `node_modules`), so this only bites locally — which makes it easy to misread as a styling problem.
- **View Transitions**: ThemeToggle re-binds on `astro:after-swap`; SiteBackdrop's MutationObserver survives page transitions
- **BackToTop visibility**: Logic is in GlobalScripts.astro, not in BackToTop.astro (Astro scoped scripts don't work reliably for global state)
- **trailingSlash**: Set to `"always"` — all internal links must end with `/`
- **Icon system**: `astro-icon` with `@iconify-json/ph` (Phosphor) and `@iconify-json/simple-icons` (brands). Use `<Icon name="ph:icon-name" />` in templates. **本地图标**: `src/icons/*.svg` 经 `local:<name>` 引用——酷安官方 logo 放 `src/icons/coolapk.svg`(viewBox 已改为正方形 1024 保证尺寸一致)、Email 用 FontAwesome 信封放 `src/icons/mail.svg`。`profile.ts` 里 `icon: "local:coolapk"` / `"local:mail"`
- **GlobalScripts pattern**: All client-side JS lives in `GlobalScripts.astro` and initializes on both `DOMContentLoaded` and `astro:page-load` for View Transitions compatibility. Individual components (Header, BlogPost) have their own scoped scripts for component-specific behavior.
- **Theme 3-way toggle**: Cycles light → dark → auto (not 2-way). `ThemeManager.getEffective()` resolves `auto` to the actual system preference; `getStored()` returns the raw stored value.
- **Mermaid renders client-side, not with Playwright**: `rehype-mermaid.mjs` only injects `mermaid-render-script.js` (`?raw`) into Mermaid containers — no headless browser is launched at build time, and builds with Mermaid code blocks succeed without Playwright/Chromium. The CI `npx playwright install` step was removed for this reason.
- **`mermaid-render-script.js` has a known bug in `loadMermaid()`**: the CDN → vendor migration left two issues: (1) line 648 references `fallbackScript` which is undefined (dead code from the removed CDN fallback), and (2) `document.head.appendChild(script)` is outside the Promise executor on line 651 where `script` is out of scope. The script currently works because the first error is inside the Promise (caught as a rejection), but if Mermaid diagrams stop rendering client-side, fix this function first.
- **Encrypted post slugs**: The `Encryptor` component needs the `slug` prop passed explicitly from the page — it's not available from context inside the layout.
- **`src/config/theme.ts` is inert — do not edit it expecting visual change.** `themeConfig` is re-exported from `src/config/index.ts` but imported by **zero** components or pages. Its values actively contradict the real ones: it declares `accentHue: 250` and `glass.blur: 20` while `tokens.css` uses `--hue: 170` and `--glass-blur: 24px`. To change theme colors, glass, or typography, edit `src/styles/tokens.css`.
- **`Temp/` is not project code.** It is gitignored (`.gitignore:30`, zero tracked files) and holds a vendored copy of the Mizuki theme kept for reference. Never edit it, and exclude it when searching — its `biome.json` / `tsconfig.json` / `.env.example` are not this project's.
- **Unused leftovers — don't wire them up without being asked**: `src/plugins/expressive-code/copy-button-plugin.ts` exists but is *not* registered in `astro.config.mjs` (only `language-badge.ts` is); `generateAbbrlink()` / `isValidAbbrlink()` in `src/utils/abbrlink.ts` are unused **on purpose** — see Post URLs. The file's live exports are `getPostSlug` / `getPostUrl`.
- **Expressive Code, not Shiki**: code highlighting is configured through the `expressiveCode({...})` integration in `astro.config.mjs`. Astro's `markdown.shikiConfig` is not used and editing it has no effect.
- **`git add -A` / `git add .` is forbidden in this repo while `content/` exists.** The private content clone lives inside the project tree (gitignored, so normally safe), but any future change that touches `.gitignore` or moves `content/` could expose it. Always stage explicit paths.
- **Locating project files from page frontmatter: use `process.cwd()`, never `new URL(..., import.meta.url)`.** After `astro build`, `import.meta.url` points at the compiled module in `dist/chunks/` — relative paths resolve into `dist/` and silently miss (anime.astro shipped an empty page this way; the build log looked fine because the fetch script succeeded). Builds always run from the project root, so `resolve(process.cwd(), "src/data/…")` is correct in both dev and build.
- **Frontmatter dates render at UTC face value.** Unquoted YAML datetimes parse as UTC; `FormattedDate` and all date grouping read them back with UTC getters so the author-written date is what displays. Formatting with local-time getters shifts post-16:00 dates +1 day (matched the live site's convention; fixed once already — keep the UTC discipline for any new date rendering).
- **The homepage is `src/pages/[...page].astro`** — there is no `src/pages/index.astro`. Looking for the homepage by filename will fail.
- **`DOMContentLoaded` and `astro:page-load` BOTH fire on the first page load.** Any init function registered on both runs twice on first load. For idempotent work that is harmless; for `addEventListener` it is not. A double-bound toggle handler cancels itself out — this actually shipped, and made the desktop nav dropdown unopenable on first load until a client-side navigation re-ran init on a fresh DOM. Element-level bindings need an idempotency guard (`header.dataset.headerInit`); the flag resets naturally because View Transitions replace the element. Verified by A/B test against a headless browser.
- **`window` and `document` survive View Transitions; page elements do not.** Listeners bound to them belong at module top level (module scripts execute once per document), never inside a per-navigation init function — otherwise they accumulate one per navigation and their closures pin swapped-out DOM nodes in memory. See the top of `Header.astro`'s script for the intended shape.
- **`is:inline` scripts must not contain bare JS `{...}` braces.** Astro parses `{}` as template expressions inside `is:inline` scripts, so an IIFE (`(() => {`) or object literal breaks the build with `Expected ',' or '}' but found '.'`. This actually shipped and broke three files in one round (calendar/ProfileCard/homepage). For script-heavy components use a plain `<script data-astro-rerun>` instead — it's bundled as a module (braces safe), `data-astro-rerun` re-runs it after each View Transitions navigation, and data can flow via `data-*` attributes + `JSON.parse` (see `ProfileCard.astro` / `[...page].astro`). `define:vars` is the alternative for `is:inline`-injected data, but only when the script body itself has no bare braces.
