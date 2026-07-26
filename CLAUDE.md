# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:4321)
pnpm build            # Build for production → dist/
pnpm preview          # Preview production build
pnpm sync-content     # Manually sync content repository
```

**Package manager**: pnpm (not npm/yarn). Lockfile is `pnpm-lock.yaml`.
**Node requirement**: `>=22.12.0`

**After editing `.astro` or CSS files**: rebuild and visually verify. Astro caches aggressively in `.astro/` — if changes don't appear, delete `.astro/` and `dist/` before rebuilding.

**Content sync**: `pnpm dev` and `pnpm build` automatically run `scripts/sync-content.js` via `predev`/`prebuild` hooks. This clones/updates a separate content repository and creates symlinks into `src/content/`. If no `.env` exists, the sync is skipped and local `src/content/` is used.

**Deployment**: GitHub Actions deploys to GitHub Pages. The build step installs Playwright (Chromium) because Mermaid diagram rendering requires it at build time.

**No test or lint tooling exists.** `package.json` defines no `test`/`lint`/`format` script, and there is no ESLint / Prettier / Biome config in the repo. Verification means `pnpm build` completes + visual check in the browser. Do not invent or assume a test command.

**Background dev server** (from `AGENTS.md`): `astro dev --background`, managed with `astro dev stop` / `astro dev status` / `astro dev logs`.

## Architecture

This is an **Astro 7.x** static blog site with **no runtime JS framework** (no React/Vue/Svelte). All components are `.astro` files with scoped `<style>` blocks and vanilla `<script>`.

### Design System

The entire visual identity is driven by **CSS custom properties** in `src/styles/tokens.css`:

- **Single hue system**: `--hue: 170` (oklch color space) drives the entire palette — change one value, everything shifts
- **Layered surfaces**: `--surface-0` (deepest) through `--surface-3` (highest)
- **Liquid glass**: `--glass-bg`, `--glass-border`, `--glass-blur` etc. — used by Header pills, BackToTop, TOC panel
- **Three-tier text**: `--foreground` / `--foreground-secondary` / `--foreground-muted`

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

**Critical**: `backdrop-filter` only works on elements floating OVER content (Header pill, BackToTop, TOC panel). It does NOT produce visible results on in-flow elements like article cards — there's nothing interesting behind them to blur.

### Content Sync Architecture

Blog content lives in a **separate repository** (`Dusklight-Content`), not in this repo. The sync script (`scripts/sync-content.js`) clones/updates that repo and creates symlinks:

| Content repo path | Symlink target |
|---|---|
| `content/blog/` | `src/content/` (posts) |
| `content/pages/` | `src/content/pages/` |
| `content/data/` | `src/data/` |
| `content/images/` | `public/images/` |

Configuration via `.env` (see `.env.example`). When `ENABLE_CONTENT_SYNC` is not `true`, the local `src/content/` directory is used directly. The content repo can trigger framework rebuilds via GitHub Actions `repository_dispatch`.

### Anti-Mirror System

The site includes a build-time anti-mirror mechanism to redirect visitors on unauthorized domains:

- `src/components/common/AntiMirror.astro` — inline `<script>` injected in `<head>` that checks `location.hostname` against the canonical domain
- `scripts/obfuscate-anti-mirror.js` — runs as `postbuild`, obfuscates the anti-mirror script in `dist/` with random variable names to deter bypassing
- Controlled by `siteConfig.antiMirror.enabled` in `src/config/site.ts`

### Encrypted Posts

Articles can be password-encrypted via frontmatter (`password`, `hint` fields). The `Encryptor.astro` component renders a password prompt and decrypts content client-side using `src/utils/crypto-utils.ts`. Encrypted posts use a separate stylesheet (`src/styles/encrypted-content.css`).

### Remark/Rehype Plugin Architecture

Custom markdown plugins live in `src/plugins/` (not in `node_modules`). These are **project-specific transforms**, not third-party packages:

| Plugin | Purpose |
|---|---|
| `remark-content.mjs` | Injects `excerpt`, `minutes` (reading time), `words` into frontmatter. CJK-aware: Latin counted at 200 wpm, CJK characters at 400 cpm |
| `remark-mermaid.js` | Extracts Mermaid code blocks for build-time rendering |
| `remark-fix-github-admonitions.js` | Normalizes GitHub-style `> [!NOTE]` syntax |
| `remark-directive-rehype.js` | Bridges remark-directive to rehype custom components |
| `remark-escape-numeric-colons.mjs` | Fixes colon parsing in certain contexts |
| `rehype-mermaid.mjs` | Renders Mermaid diagrams to SVG via Playwright (SSR) |
| `rehype-wrap-table.mjs` | Wraps `<table>` in scrollable container |
| `rehype-image-width.mjs` | Injects intrinsic image dimensions |
| `rehype-component-admonition.mjs` | Custom admonition component (`:::note`, `:::tip`, etc.) |
| `rehype-component-github-card.mjs` | `<github repo="owner/repo">` embed cards |
| `rehype-component-image-grid.mjs` | `<grid>` image grid layout |
| `mermaid-render-script.js` | Browser-side script the Playwright page runs to rasterize Mermaid to SVG |
| `expressive-code/language-badge.ts` | Expressive Code plugin — language badge on code block frames (registered) |

**Mermaid rendering** requires Playwright (Chromium) at build time — this is why the CI workflow installs `npx playwright install --with-deps chromium`.

### Import Aliases

`@/` maps to `src/` — configured in both `astro.config.mjs` (Vite resolve alias) and `tsconfig.json` (path mapping). Use `@/config`, `@/components`, etc. in imports.

### Markdown Pipeline

Configured in `astro.config.mjs`:
- **remark-math** → parse `$...$` and `$$...$$` math expressions
- **rehype-katex** → render math with KaTeX (CSS loaded from CDN in `cdn.ts`)
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
- **Code frames use `--code-bg` (= `--surface-1`, opaque in both themes), not `--glass-bg`.** `github-light` / `github-dark` are palettes tuned for a specific canvas (`#FFFFFF` / `#0D1117`); a translucent frame composites the backdrop photo into that canvas and the palette loses contrast unpredictably. Measured on the real backdrop images: at the old `--glass-bg` alpha, **0 %** of light-mode syntax fragments met WCAG AA and contrast swung by up to 10.2 between the photo's bright and dark regions; dark mode dropped to 82.9 % because the dark backdrop has a bright green region that tinted the frame. Opaque `--surface-1` puts dark mode at its palette ceiling (99.2 %) and light mode at 96.8 % vs a 97.3 % pure-white ceiling — the 0.5 pp is a deliberate trade (4 rare fragments at ~4.3:1) for tonal cohesion; a pure-white frame looked pasted-on over the photo, and the reference site (blog.mcxiaochen.top) uses an even darker `oklch(.97 .005 170)`. Drift is zero in both modes. `backdrop-filter` was removed from `.frame` — it is a no-op behind an opaque fill, and per the Liquid Glass Pattern above, glass belongs on floating chrome, never on in-flow content.
- **Frame chrome (tab bar, terminal titlebar) is tokenized in `astro.config.mjs` `styleOverrides.frames`.** Without those overrides, EC emits the GitHub themes' literal chrome colors — `#f6f8fa` tab bar, `#fff` active tab, an **orange** active-tab indicator `#f9826c` — which ignore `--hue` and clash with the site's teal accent. The overrides map: tab bar / titlebar → `--surface-2`, active tab → `--code-bg`, active-tab indicator → `--accent`, separators → `--border-subtle`, dots → `--foreground-muted`. One value serves both themes because the tokens themselves flip under `.dark`.
- Extra visual tuning lives in `src/styles/expressive-code.css`, imported by `BlogPost.astro`
- The **copy button is Expressive Code's built-in one** — the old hand-rolled copy script was removed from `GlobalScripts.astro`

### Component Architecture

```
src/components/
├── common/     # Header, Footer, ThemeToggle, BackToTop, ScrollProgress, SiteBackdrop, GlobalScripts, AntiMirror
├── blog/       # PostCard, PostCardList, ArticleMeta, TOC, TwikooComments, Encryptor
├── seo/        # SEOHead (meta/OG/canonical), JsonLd
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
  - `cover` (string, optional)
  - `pinned` (boolean, default `false`)
  - `author` (string, optional)
  - `draft` (boolean, default `false`)
  - `abbrlink` (string, optional)
  - `comment` (boolean, default `true`) — hidden, always-on unless explicitly set
  - `toc` (boolean, default `true`) — hidden, always-on unless explicitly set
  - `password` (string, optional) — presence turns the post into an encrypted post
  - `hint` (string, optional) — password hint shown by `Encryptor`
- **`spec`**: `src/content/spec/` — untyped markdown pages (about.md, etc.) rendered via `getEntry()` + `render()`

### Remark-Injected Frontmatter (excerpt / reading time)

`remark-content.mjs` computes `excerpt`, `minutes`, and `words` during markdown compilation, so these values **do not exist on `post.data`** — they live in the render output. There are two different access paths in this codebase, and which one you need depends on whether you have rendered the post:

- `src/pages/posts/[...slug].astro` reads them off the already-rendered entry: `post.rendered?.metadata?.frontmatter`
- `src/pages/[...page].astro` cannot — so it `await render(post)` for **every** post inside `getStaticPaths` purely to collect excerpts, then passes them down as a `props.excerpts` map keyed by `post.id`

Excerpt source: text before a `<!-- more -->` HTML comment if present, otherwise the first non-empty paragraph. Code blocks are excluded from both excerpt and word count.

### Routing & Pagination

| Route file | URL(s) |
|---|---|
| `src/pages/[...page].astro` | `/` and `/2/`, `/3/`… (verified in `dist/`) — **this is the homepage**; there is no `index.astro` |
| `src/pages/posts/[...slug].astro` | `/posts/<abbrlink 或 post.id>/` — see Post URLs below |
| `src/pages/tags/index.astro`, `tags/[tag].astro` | tag index + per-tag listing |
| `src/pages/archive.astro`, `about.astro`, `404.astro` | static pages |
| `src/pages/rss.xml.js` | RSS feed endpoint |

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

`src/config/nav.ts` supports nested dropdowns via `children?: NavItem[]`. Header renders desktop dropdowns with hover + click toggle, mobile as grouped sections.

## Key Configuration Files

| File | Purpose |
|------|---------|
| `src/config/site.ts` | Site title, description, postsPerPage, feature toggles |
| `src/config/profile.ts` | Name, avatar, bio, location, MBTI, socials, skills, intro |
| `src/config/nav.ts` | Navigation menu structure + social links |
| `src/config/comment.ts` | Twikoo comment system envId |
| `src/config/cdn.ts` | CDN resource URLs (Twikoo, KaTeX, Mermaid) |
| `src/config/seo.ts` | SEO defaults, JSON-LD, search engine verification |
| `src/config/theme.ts` | ⚠️ Exported but **consumed by nothing** — see Gotchas. Real values live in `tokens.css` |
| `src/config/index.ts` | Barrel export for all config modules |

All config is re-exported from `src/config/index.ts` — import via `import { siteConfig, themeConfig } from "@/config"`.

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
- Installs pnpm 9, Node 22, Playwright Chromium
- Runs `pnpm sync-content` to fetch content, then `pnpm build`
- Deploys `dist/` to GitHub Pages

`.github/content-repo-trigger.yml` is a template to copy into the content repo — it sends `repository_dispatch` events when content changes.

## Conventions

- **Commit messages**: Use standard [Conventional Commits](https://www.conventionalcommits.org/) format — `feat:`, `fix:`, `docs:`, `refactor:`, etc. No custom prefixes like `@`.
- **No auto-push**: Never `git push` unless the user explicitly asks. Commit locally only.
- **Confirm before coding**: After receiving a new task, restate your understanding back to the user before writing any code. Avoid cognitive bias — if the interpretation is wrong, the user will correct you before you waste effort.

## Gotchas

- **Build cache**: If CSS changes don't appear, delete `.astro/` and `dist/` before rebuilding.
- **`node_modules/.astro/` is a THIRD cache, and `rm -rf .astro dist` does not touch it.** Its `data-store.json` holds the *rendered HTML* of every content entry — including the `<link rel="stylesheet" href="/_astro/ec.<hash>.css">` that `astro-expressive-code` injects into the rendered markdown AST. The hash is content-derived, so whenever EC's generated CSS changes but the markdown does not, the cached HTML keeps pointing at the **old** hash while the build emits the **new** file. Result: every page requests a stylesheet that 404s, all syntax highlighting silently dies, and code renders flat in `--foreground`. This actually shipped and was mistaken for a contrast bug. Diagnose with:
  ```bash
  echo "ref: $(grep -o 'ec\.[a-z0-9]*\.css' dist/posts/<any>/index.html | head -1)"
  echo "got: $(ls dist/_astro/ | grep -o 'ec\.[a-z0-9]*\.css')"
  ```
  If they differ, `rm -rf node_modules/.astro .astro dist && pnpm build`. CI is immune (fresh `node_modules`), so this only bites locally — which makes it easy to misread as a styling problem.
- **View Transitions**: ThemeToggle re-binds on `astro:after-swap`; SiteBackdrop's MutationObserver survives page transitions
- **BackToTop visibility**: Logic is in GlobalScripts.astro, not in BackToTop.astro (Astro scoped scripts don't work reliably for global state)
- **trailingSlash**: Set to `"always"` — all internal links must end with `/`
- **Icon system**: `astro-icon` with `@iconify-json/ph` (Phosphor) and `@iconify-json/simple-icons` (brands). Use `<Icon name="ph:icon-name" />` in templates
- **GlobalScripts pattern**: All client-side JS lives in `GlobalScripts.astro` and initializes on both `DOMContentLoaded` and `astro:page-load` for View Transitions compatibility. Individual components (Header, BlogPost) have their own scoped scripts for component-specific behavior.
- **Theme 3-way toggle**: Cycles light → dark → auto (not 2-way). `ThemeManager.getEffective()` resolves `auto` to the actual system preference; `getStored()` returns the raw stored value.
- **Mermaid requires Playwright**: Building with Mermaid diagrams needs Chromium installed (`npx playwright install --with-deps chromium`). The `rehype-mermaid.mjs` plugin launches a headless browser to render diagrams to SVG at build time. Without Playwright, the build will fail on posts containing Mermaid code blocks.
- **Encrypted post slugs**: The `Encryptor` component needs the `slug` prop passed explicitly from the page — it's not available from context inside the layout.
- **`src/config/theme.ts` is inert — do not edit it expecting visual change.** `themeConfig` is re-exported from `src/config/index.ts` but imported by **zero** components or pages. Its values actively contradict the real ones: it declares `accentHue: 250` and `glass.blur: 20` while `tokens.css` uses `--hue: 170` and `--glass-blur: 12px`. To change theme colors, glass, or typography, edit `src/styles/tokens.css`.
- **`Temp/` is not project code.** It is gitignored (`.gitignore:30`, zero tracked files) and holds a vendored copy of the Mizuki theme kept for reference. Never edit it, and exclude it when searching — its `biome.json` / `tsconfig.json` / `.env.example` are not this project's.
- **Unused leftovers — don't wire them up without being asked**: `src/plugins/expressive-code/copy-button-plugin.ts` exists but is *not* registered in `astro.config.mjs` (only `language-badge.ts` is); `generateAbbrlink()` / `isValidAbbrlink()` in `src/utils/abbrlink.ts` are unused **on purpose** — see Post URLs. The file's live exports are `getPostSlug` / `getPostUrl`.
- **Expressive Code, not Shiki**: code highlighting is configured through the `expressiveCode({...})` integration in `astro.config.mjs`. Astro's `markdown.shikiConfig` is not used and editing it has no effect.
- **Content sync uses Windows junctions**: `scripts/sync-content.js` calls `symlinkSync(..., "junction")` (no admin rights needed on Windows) and silently falls back to `cpSync` if that fails. A copy fallback means later content-repo updates won't propagate until the next sync.
- **The homepage is `src/pages/[...page].astro`** — there is no `src/pages/index.astro`. Looking for the homepage by filename will fail.
- **`DOMContentLoaded` and `astro:page-load` BOTH fire on the first page load.** Any init function registered on both runs twice on first load. For idempotent work that is harmless; for `addEventListener` it is not. A double-bound toggle handler cancels itself out — this actually shipped, and made the desktop nav dropdown unopenable on first load until a client-side navigation re-ran init on a fresh DOM. Element-level bindings need an idempotency guard (`header.dataset.headerInit`); the flag resets naturally because View Transitions replace the element. Verified by A/B test against a headless browser.
- **`window` and `document` survive View Transitions; page elements do not.** Listeners bound to them belong at module top level (module scripts execute once per document), never inside a per-navigation init function — otherwise they accumulate one per navigation and their closures pin swapped-out DOM nodes in memory. See the top of `Header.astro`'s script for the intended shape.
