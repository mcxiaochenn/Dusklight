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
| `remark-content.mjs` | Injects reading time and word count into frontmatter |
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
- **Shiki** → syntax highlighting with dual themes (`github-light` / `github-dark`)

### Component Architecture

```
src/components/
├── common/     # Header, Footer, ThemeToggle, BackToTop, ScrollProgress, SiteBackdrop, GlobalScripts
├── blog/       # PostCard, PostCardList, ArticleMeta, TOC, TwikooComments
└── ui/         # Button, Tag, Divider, Card, CodeBlock, Blockquote
```

- **BaseLayout.astro** — wraps every page (Header + slot + Footer + ScrollProgress + BackToTop + GlobalScripts)
- **GlobalScripts.astro** — all client-side JS in one place: code block copy, image lightbox, scroll reveal, back-to-top logic. Initialized on both `DOMContentLoaded` and `astro:page-load`.
- **SiteBackdrop.astro** — lazy-loads background images, switches via MutationObserver on `<html>` class changes

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
- **`spec`**: `src/content/spec/` — untyped markdown pages (about.md, etc.) rendered via `getEntry()` + `render()`

### Theme Switching

ThemeToggle cycles **light → dark → auto** (3 modes, not 2). The animation:

1. Records old theme color via `getComputedStyle`
2. Immediately applies new theme via `applyTheme()`
3. Creates a full-screen overlay with old color, clip-path `circle(0)` → expands to full screen → shrinks back to 0 → removes overlay

Uses `getEffective()` (not `getStored()`) to determine toggle cycle — `auto` resolves to the actual system preference.

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
| `src/config/theme.ts` | Default theme, glass params, typography settings |
| `src/config/index.ts` | Barrel export for all config modules |

All config is re-exported from `src/config/index.ts` — import via `import { siteConfig, themeConfig } from "@/config"`.

**Note**: `src/consts.ts` exists but is a leftover from the Astro starter template. The actual site constants are in `src/config/site.ts`.

## Styling Conventions

- All CSS uses design tokens from `tokens.css` — no magic numbers
- Components use scoped `<style>` blocks (Astro auto-scopes with `data-astro-cid-*`)
- Global styles in `src/styles/` are imported via `global.css` (tokens → reset → base → typography → glass → animations → utilities)
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

- **Build cache**: If CSS changes don't appear, delete `.astro/` and `dist/` directories before rebuilding
- **View Transitions**: ThemeToggle re-binds on `astro:after-swap`; SiteBackdrop's MutationObserver survives page transitions
- **BackToTop visibility**: Logic is in GlobalScripts.astro, not in BackToTop.astro (Astro scoped scripts don't work reliably for global state)
- **trailingSlash**: Set to `"always"` — all internal links must end with `/`
- **Icon system**: `astro-icon` with `@iconify-json/ph` (Phosphor) and `@iconify-json/simple-icons` (brands). Use `<Icon name="ph:icon-name" />` in templates
- **GlobalScripts pattern**: All client-side JS lives in `GlobalScripts.astro` and initializes on both `DOMContentLoaded` and `astro:page-load` for View Transitions compatibility. Individual components (Header, BlogPost) have their own scoped scripts for component-specific behavior.
- **Theme 3-way toggle**: Cycles light → dark → auto (not 2-way). `ThemeManager.getEffective()` resolves `auto` to the actual system preference; `getStored()` returns the raw stored value.
- **Mermaid requires Playwright**: Building with Mermaid diagrams needs Chromium installed (`npx playwright install --with-deps chromium`). The `rehype-mermaid.mjs` plugin launches a headless browser to render diagrams to SVG at build time. Without Playwright, the build will fail on posts containing Mermaid code blocks.
- **Encrypted post slugs**: The `Encryptor` component needs the `slug` prop passed explicitly from the page — it's not available from context inside the layout.
