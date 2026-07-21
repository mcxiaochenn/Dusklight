# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:4321)
pnpm build            # Build for production → dist/
pnpm preview          # Preview production build
```

**Node requirement**: `>=22.12.0`

**After editing `.astro` or CSS files**: rebuild and visually verify. Astro caches aggressively in `.astro/` — if changes don't appear, delete `.astro/` and `dist/` before rebuilding.

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

- **`blog`**: `src/content/posts/` — typed frontmatter (title, description, pubDate, tags, cover, etc.)
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
| `src/config/cdn.ts` | CDN resource URLs |

## Styling Conventions

- All CSS uses design tokens from `tokens.css` — no magic numbers
- Components use scoped `<style>` blocks (Astro auto-scopes with `data-astro-cid-*`)
- Global styles in `src/styles/` are imported via `global.css` (tokens → reset → base → typography → glass → animations → utilities)
- `.prose` class in `typography.css` handles all long-form content typography
- Responsive: `@media (max-width: 768px)` and `@media (max-width: 640px)` breakpoints

## Gotchas

- **Build cache**: If CSS changes don't appear, delete `.astro/` and `dist/` directories before rebuilding
- **View Transitions**: ThemeToggle re-binds on `astro:after-swap`; SiteBackdrop's MutationObserver survives page transitions
- **BackToTop visibility**: Logic is in GlobalScripts.astro, not in BackToTop.astro (Astro scoped scripts don't work reliably for global state)
- **trailingSlash**: Set to `"always"` — all internal links must end with `/`
- **Icon system**: `astro-icon` with `@iconify-json/ph` (Phosphor) and `@iconify-json/simple-icons` (brands). Use `<Icon name="ph:icon-name" />` in templates
