# Dusklight

> **⚠️ 早期开发阶段 — 请勿用于生产环境**
>
> 本项目正在积极开发中，API、文件结构、配置格式可能随时变更。
> 不保证数据兼容性，升级可能导致内容丢失。欢迎体验和反馈，但请勿在正式环境部署。

---

A personal blog theme built with [Astro](https://astro.build), featuring a liquid glass design system, dark/light/auto theme switching, and a clean editorial layout.

## Features

- 🪟 **Liquid Glass UI** — backdrop-filter based glass effect with edge refraction highlights
- 🌗 **Theme Switching** — light / dark / auto with circular clip-path transition animation
- 📝 **MDX Support** — Markdown + MDX content with syntax highlighting (Expressive Code, dual themes)
- 🏷️ **Content Collections** — typed blog posts with tags, categories, reading time
- 💬 **Comments** — Twikoo integration with theme-aware styling
- 📱 **Responsive** — mobile-first layout with floating pill navigation
- ⚡ **Performance** — static site generation, lazy-loaded backdrop images
- 🔍 **SEO** — sitemap, RSS feed, Open Graph, JSON-LD structured data
- 🎨 **Icon System** — Phosphor Icons + Simple Icons via astro-icon (tree-shaken)

## Tech Stack

- [Astro 7.x](https://astro.build) — static site generator
- [Expressive Code](https://expressive-code.com/) — code blocks with line numbers, collapsible sections, language badges
- [astro-icon](https://www.astroicon.dev/) + [Iconify](https://iconify.design/) — icon system
- [Twikoo](https://twikoo.js.org/) — comment system
- [Inter Variable](https://rsms.me/inter/) — typography
- oklch color system — single `--hue` variable drives the entire palette

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```text
├── public/              # Static assets (images, fonts, favicon)
├── src/
│   ├── components/      # UI components (common/, blog/, ui/)
│   ├── config/          # Site, profile, nav, comment configuration
│   ├── content/
│   │   ├── posts/       # Blog posts (Markdown/MDX)
│   │   └── spec/        # Standalone pages (about.md, etc.)
│   ├── layouts/         # BaseLayout, BlogPost
│   ├── pages/           # Routes (index, about, archive, tags, blog)
│   └── styles/          # Design tokens, glass, typography, animations
├── DESIGN.md            # Design system documentation
├── astro.config.mjs     # Astro configuration
└── package.json
```

## Configuration

All site content is managed through config files in `src/config/`:

| File | Purpose |
|------|---------|
| `site.ts` | Site title, description, features |
| `profile.ts` | Personal info, avatar, skills, social links |
| `nav.ts` | Navigation menu (supports dropdown children) |
| `comment.ts` | Twikoo comment system settings |
| `cdn.ts` | CDN resource URLs |

## Design System

See [DESIGN.md](./DESIGN.md) for the complete design specification.

Key design tokens are defined in `src/styles/tokens.css`:

- `--hue` — single value drives the entire color palette
- `--glass-*` — liquid glass effect parameters
- `--surface-0` through `--surface-3` — layered depth system
- `--foreground` / `--foreground-secondary` / `--foreground-muted` — text hierarchy

## License

MIT
