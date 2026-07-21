# Dusklight — Design Constitution

> This document is the single source of truth for every visual and structural decision in Dusklight.
> No component, page, or style shall be implemented without consulting this document first.

---

## 1. Design Philosophy

Dusklight is a personal blog that treats content as the protagonist. Every pixel of whitespace, every typographic choice, every motion curve exists to serve one purpose: making the reading experience effortless and memorable.

The design does not shout. It whispers with precision.

We draw principles from Apple HIG (spatial clarity), Linear (confident minimalism), Arc (layered depth), Vercel (dark sophistication), Notion (content-first hierarchy), and Medium (editorial flow). We do not imitate any of them. We extract what makes each feel premium and recombine those principles into something that belongs only to Dusklight.

### The Fundamental Rule

**Dusklight is a design system, not a collection of pages.**

Every page — homepage, article, archive, tags, about — is a different composition of the same shared components, tokens, and interaction patterns. Pages are layouts. The design system is the identity.

Think of it as rooms in a building: each room has different furniture arrangements, but the flooring, walls, lighting, and architectural language are consistent throughout. You never walk into a room that feels like it belongs to a different house.

This means:
- There is ONE typography system. Every page uses it.
- There is ONE color system. Every page uses it.
- There is ONE spacing rhythm. Every page uses it.
- There is ONE card style. Every page uses it.
- There is ONE button style. Every page uses it.
- There is ONE glass specification. Every page uses it.
- There is ONE animation system. Every page uses it.

Pages differ only in **how components are composed**, not in how they look.

### Core Principles

1. **Content is king.** The interface must never compete with what the visitor came to read. Every decorative element earns its place by improving comprehension or spatial orientation.

2. **Restraint is luxury.** The most expensive-looking thing in design is knowing what to leave out. We use fewer elements, not more. We use larger gaps, not smaller ones. We use fewer colors, not more.

3. **Asymmetry creates rhythm.** Perfect symmetry is forgettable. We break alignment intentionally to create visual movement that guides the eye through content like a well-edited magazine spread.

4. **Dark mode is the primary canvas.** Light mode is supported but dark mode is where the design lives. Dark surfaces recede, letting content and accent colors emerge with greater presence.

5. **Glass is seasoning, not the meal.** Liquid glass effects appear only on interactive overlay surfaces — navigation, search, floating controls, dialogs, TOC panels. Content surfaces remain opaque. Glass should feel like a physical material, not a filter applied to everything.

6. **Motion has physics, not drama.** Every animation obeys inertia. Things decelerate as they arrive. Nothing bounces. Nothing springs. Motion communicates spatial relationships, not personality.

7. **Typography is the primary visual language.** Hierarchy through scale, weight, and spacing — never through decoration. The type system alone should make the page feel structured and beautiful even with all colors removed.

8. **System first, pages second.** Always build or modify a shared component before creating a page-specific one. If a new page needs a UI element, check whether an existing component can be extended with a variant before creating something new.

---

## 2. Visual Identity

### What Dusklight Looks Like

A dark editorial canvas with deep, desaturated blue-violet undertones. Generous vertical rhythm. Article titles that command attention through scale alone. Paragraphs that breathe. Code blocks that sit comfortably in the flow. Floating glass elements that feel like physical panes hovering above the content.

### What Dusklight Does NOT Look Like

- A dashboard or admin panel
- A WordPress theme
- A Material Design app
- A Tailwind template
- A portfolio with parallax scrolling
- A linktree or social media page
- An Apple product page (we borrow principles, not aesthetics)

### The Impression

A visitor should feel: *"This person cares deeply about how they present their ideas."*

Not: *"This person used a nice template."*

---

## 3. Brand Keywords

These nine words guide every design decision. When uncertain, return to this list:

| Keyword        | Meaning in Design Context                                          |
| -------------- | ------------------------------------------------------------------ |
| **Elegant**    | Nothing is crude, rushed, or unconsidered. Every detail is intentional. |
| **Quiet**      | Low visual noise. The design doesn't demand attention — it earns it. |
| **Modern**     | Current without being trendy. Uses contemporary techniques (oklch, container queries) without showing off. |
| **Technical**  | Precise, structured, confident. The grid is intentional. The spacing is systematic. |
| **Premium**    | Feels handcrafted, not assembled. The quality difference is in the details most people won't consciously notice. |
| **Craftsmanship** | Every border-radius, every shadow, every transition curve was chosen, not defaulted. |
| **Editorial**  | Magazine-quality layout. Strong typographic hierarchy. Content pacing over decoration. |
| **Readable**   | Optimized for long-form reading. Comfortable line length, generous leading, clear hierarchy. |
| **Confident**  | Bold scale choices. Large titles. Unafraid of whitespace. Doesn't hedge with busy layouts. |
| **Timeless**   | Will look as good in three years as it does today. No trend-chasing. |

---

## 4. Layout Principles

### 4.1 The Grid We Don't Use

Dusklight does **not** use a traditional symmetric grid for content layout. Instead:

- **Homepage**: Asymmetric two-column layout. A dominant hero post occupies 60% of the width on the left; secondary posts stack vertically in the remaining 40% on the right. On smaller screens, the hero collapses to full-width above a single-column stream.

- **Article pages**: Content column is intentionally off-center. The reading column sits at approximately 55% of the viewport, leaving the right side for the floating TOC (which is glass). This creates visual weight on the left and breathing room on the right.

- **About page**: An editorial spread. Large typographic statement at the top, content that flows in mixed-width sections, breaking out of the column where appropriate for images or pull quotes.

### 4.2 Whitespace as a Design Element

Whitespace is not empty space. It is a structural element with the same visual weight as text or images.

**Vertical rhythm rule**: Every major section boundary uses at minimum `6rem` (96px) of vertical space. Between articles, between the header and content, between the content and footer — whitespace is the separator, not borders or lines.

**Horizontal breathing**: Content never touches the viewport edge. Minimum `2rem` padding on mobile, `4rem` on desktop. On ultra-wide screens (>1440px), content is centered with generous margins.

### 4.3 Breaking the Grid

Intentional grid-breaking moments:

- **Pull quotes** in articles extend 20% beyond the content column into the margin
- **Full-width images** break out of the content column entirely
- **The featured post** on the homepage bleeds into the whitespace of its neighbors
- **Code blocks** with long lines allow horizontal scroll rather than wrapping

### 4.4 Reading Experience

- **Maximum content width**: 680px (42.5rem) for article body text
- **Comfortable line length**: 65–75 characters per line (optimal for reading)
- **Paragraph spacing**: 1.5× the line height between paragraphs
- **Section breaks**: Generous spacing + optional subtle divider, never aggressive

---

## 5. Typography Rules

Typography is the strongest visual element in Dusklight. It carries the entire design.

### 5.1 Font Stack

```css
/* Headings — Display & UI */
--font-display: "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif;

/* Body — Reading */
--font-body: "Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace — Code */
--font-mono: "JetBrains Mono", "Cascadia Code", "Fira Code", "SF Mono", monospace;

/* CJK Fallback */
--font-cjk: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
```

**Font loading strategy**: Self-host Inter variable font (weight axis: 300–700). Use `font-display: swap` for all weights. Preload the regular (400) weight only.

> **Note**: The existing Atkinson Hyperlegible font is being replaced by Inter for its superior CJK fallback behavior and wider weight range. The Atkinson `.woff` files in `src/assets/fonts/` will be removed.

### 5.2 Type Scale

A modular scale based on `1.250` (major third) ratio, with the base at `1rem` (16px) on desktop and `0.9375rem` (15px) on mobile.

| Token             | Size (desktop) | Size (mobile) | Weight | Use                    |
| ----------------- | -------------- | ------------- | ------ | ---------------------- |
| `--text-2xl`      | 3.052rem       | 2.441rem      | 700    | Article h1, page hero  |
| `--text-xl`       | 2.441rem       | 1.953rem      | 700    | Section h2             |
| `--text-lg`       | 1.953rem       | 1.563rem      | 600    | Subsection h3          |
| `--text-md`       | 1.25rem        | 1.125rem      | 600    | h4, card titles        |
| `--text-base`     | 1rem           | 0.9375rem     | 400    | Body text              |
| `--text-sm`       | 0.875rem       | 0.8125rem     | 400    | Meta, captions         |
| `--text-xs`       | 0.75rem        | 0.6875rem     | 500    | Tags, badges           |

### 5.3 Heading Rules

- **H1**: `--text-2xl`, weight 700, letter-spacing `-0.025em`, line-height `1.15`
- **H2**: `--text-xl`, weight 700, letter-spacing `-0.02em`, line-height `1.2`
- **H3**: `--text-lg`, weight 600, letter-spacing `-0.015em`, line-height `1.25`
- **H4**: `--text-md`, weight 600, letter-spacing `-0.01em`, line-height `1.35`

Headings use negative letter-spacing to feel tighter and more confident. This is a deliberate design choice — loose letter-spacing on large text looks amateur.

### 5.4 Body Text Rules

- **Line height**: `1.75` for body text (generous, but not excessive)
- **Paragraph margin**: `1.25em` (not `1em` — paragraphs need room to breathe)
- **Font weight**: 400 for body. Never bold body text unless inline emphasis.
- **Text color**: Use `--foreground` (near-white on dark, near-black on light). Never pure white `#fff` or pure black `#000`.

### 5.5 Code Typography

- **Inline code**: `--text-sm`, weight 500, `--font-mono`, with subtle background pill
- **Code blocks**: `--text-sm`, line-height `1.6`, horizontal scroll on overflow, never wrap
- **Code block padding**: `1.25rem` all sides — enough room to feel spacious

### 5.6 Whitespace as Typography

Whitespace is part of the typographic system, not a byproduct:

- **Micro spacing** (`0.25rem`–`0.5rem`): Between a heading and its first paragraph, between list items
- **Section spacing** (`3rem`–`4rem`): Between content sections within an article
- **Page spacing** (`6rem`+): Between the header and content, content and footer, between articles on the homepage

---

## 6. Color System

### 6.1 Color Philosophy

The color system is built on oklch for perceptual uniformity. A single `--hue` variable drives the entire palette, making it trivial to shift the accent color without breaking contrast relationships.

Dark mode is primary. The palette is designed dark-first and adapted to light mode.

### 6.2 Accent Colors

The accent hue is `250` (a desaturated blue-violet). This is intentionally muted — saturated colors fight with content for attention.

```css
/* Accent */
--accent:         oklch(0.72 0.14 var(--hue));   /* Primary accent */
--accent-dim:     oklch(0.60 0.10 var(--hue));   /* Muted accent */
--accent-bright:  oklch(0.82 0.16 var(--hue));   /* Hover / highlight */
--accent-subtle:  oklch(0.72 0.14 var(--hue) / 0.12);  /* Tinted backgrounds */
```

### 6.3 Dark Mode Palette (Primary)

```css
/* Surfaces — layered depth */
--surface-0:  oklch(0.13  0.012 var(--hue));   /* Page background — deepest */
--surface-1:  oklch(0.155 0.013 var(--hue));   /* Elevated surface — cards, content */
--surface-2:  oklch(0.185 0.015 var(--hue));   /* Higher elevation — hover, active */
--surface-3:  oklch(0.22  0.016 var(--hue));   /* Highest — modals, dropdowns */

/* Text */
--foreground:            oklch(0.93 0.008 var(--hue));  /* Primary text */
--foreground-secondary:  oklch(0.70 0.015 var(--hue)); /* Secondary text */
--foreground-muted:      oklch(0.50 0.012 var(--hue)); /* Muted text */

/* Borders */
--border:        oklch(0.25 0.015 var(--hue));        /* Default border */
--border-subtle: oklch(0.20 0.012 var(--hue));        /* Subtle separator */

/* Semantic */
--danger:  oklch(0.65 0.20 25);   /* Error, delete */
--success: oklch(0.70 0.18 155);  /* Success */
--warning: oklch(0.75 0.16 85);   /* Warning */
```

### 6.4 Light Mode Palette (Secondary)

```css
/* Surfaces */
--surface-0:  oklch(0.97  0.005 var(--hue));
--surface-1:  oklch(0.99  0.003 var(--hue));
--surface-2:  oklch(0.96  0.006 var(--hue));
--surface-3:  oklch(0.94  0.008 var(--hue));

/* Text */
--foreground:            oklch(0.18 0.015 var(--hue));
--foreground-secondary:  oklch(0.42 0.020 var(--hue));
--foreground-muted:      oklch(0.60 0.015 var(--hue));

/* Borders */
--border:        oklch(0.90 0.008 var(--hue));
--border-subtle: oklch(0.93 0.005 var(--hue));
```

### 6.5 Color Rules

1. **Never use pure white (`#fff`, `oklch(1 0 0)`) or pure black (`#000`, `oklch(0 0 0)`)**. Always tint with the accent hue, even imperceptibly.
2. **Maximum 3 visible accent colors per screen**. The accent, its dim variant, and its subtle tint.
3. **Text contrast**: Minimum `7:1` contrast ratio for body text. Minimum `4.5:1` for large text and interactive elements.
4. **Layered backgrounds**: Use `--surface-0` through `--surface-3` to create depth. Never use opacity tricks on flat backgrounds.
5. **Accent saturation limit**: Accent color chroma never exceeds `0.18`. Higher values feel garish on dark backgrounds.

---

## 7. Motion System

### 7.1 Motion Philosophy

Motion in Dusklight serves spatial awareness. It answers: *"Where did this come from? Where is it going?"* It never answers: *"Look at me!"*

### 7.2 Easing Curves

```css
/* Standard — most transitions */
--ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1);

/* Entrance — elements arriving on screen */
--ease-entrance: cubic-bezier(0.16, 1, 0.3, 1);

/* Exit — elements leaving */
--ease-exit: cubic-bezier(0.7, 0, 0.84, 0);

/* Physical — elements with mass (modals, drawers) */
--ease-physical: cubic-bezier(0.32, 0.72, 0, 1);
```

### 7.3 Duration Tokens

```css
--duration-instant: 100ms;   /* Color changes, opacity */
--duration-fast:    150ms;   /* Button states, hover effects */
--duration-normal:  250ms;   /* Panel slides, toggles */
--duration-slow:    400ms;   /* Page transitions, large movements */
--duration-lazy:    600ms;   /* Staggered entrance sequences */
```

### 7.4 Motion Rules

1. **No bounce. No spring. No elastic.** These effects feel playful, not premium.
2. **Translate Y for entrance**: Elements entering the screen move from `translateY(8px)` to `translateY(0)` with `--ease-entrance`. This is subtle — 8px, not 30px.
3. **Scale for interaction feedback**: Buttons and cards scale to `0.98` on `:active`, not `0.95`. The difference is subliminal.
4. **Opacity always accompanies transform**: Never animate position without also animating opacity. The combination feels physical; position alone feels mechanical.
5. **Stagger limit**: Maximum 5 items in a staggered sequence, each offset by `60ms`. Beyond 5, group items.
6. **`prefers-reduced-motion`**: All animations reduce to `0.01ms` duration. Transitions become instant. This is non-negotiable.

### 7.5 Specific Motion Patterns

**Page load**:
- Header fades in: 0ms delay, `--duration-normal`
- Hero content fades up: 100ms delay, `--duration-slow`
- Article cards stagger in: 150ms+ delay, `--duration-normal`, 60ms stagger

**Scroll interactions**:
- Scroll progress bar: instant width update, no animation
- Back-to-top button: `--duration-normal` fade + translate, `--ease-entrance`
- TOC active highlight: `--duration-instant` color change

**Hover interactions**:
- Card hover shadow: `--duration-fast`, `--ease-standard`
- Link underline: `--duration-instant`, `--ease-standard`
- Glass element hover: `--duration-fast` background change, no transform

**Theme toggle**:
- Color transition: `--duration-normal`, `--ease-standard`
- Icon rotation: `--duration-fast`, `--ease-entrance`

---

## 8. Glass Design Rules

### 8.1 Where Glass Appears

Glass is reserved for **interactive overlay surfaces** — elements that float above the content layer:

| Element             | Glass? | Reason                                     |
| ------------------- | ------ | ------------------------------------------ |
| Navigation bar      | Yes    | Sticky overlay, needs to show content behind |
| Search dialog       | Yes    | Modal overlay                              |
| Floating toolbar    | Yes    | Contextual overlay                         |
| Table of contents   | Yes    | Sticky sidebar overlay                     |
| Back-to-top button  | Yes    | Fixed overlay                              |
| Theme toggle        | Yes    | Floating control                           |
| Context menus       | Yes    | Dropdown overlay                           |
| Article cards       | **No** | Content surface — opaque                   |
| Article body        | **No** | Content surface — opaque                   |
| Footer              | **No** | Structural element — opaque                |
| About page content  | **No** | Content surface — opaque                   |
| Post list items     | **No** | Content surface — opaque                   |

### 8.2 Glass Specification

```css
/* Dark mode glass */
--glass-bg:          oklch(0.155 0.013 var(--hue) / 0.72);
--glass-border:      oklch(1.00 0.000 var(--hue) / 0.08);
--glass-blur:        16px;
--glass-saturation:  160%;
--glass-highlight:   inset 0 0.5px 0 oklch(1.00 0.000 var(--hue) / 0.06);

/* Light mode glass */
--glass-bg:          oklch(0.99 0.003 var(--hue) / 0.72);
--glass-border:      oklch(0.00 0.000 var(--hue) / 0.06);
--glass-blur:        16px;
--glass-saturation:  160%;
--glass-highlight:   inset 0 0.5px 0 oklch(1.00 0.000 var(--hue) / 0.5);
```

### 8.3 Glass Rules

1. **Blur radius**: `16px` standard. Never exceed `24px`. Higher blur feels like fog, not glass.
2. **Background opacity**: `0.72` — enough to separate from content, not enough to feel opaque. Never below `0.6` (too transparent) or above `0.85` (defeats the purpose).
3. **Border**: Extremely subtle — `0.08` opacity in dark mode. The border is a light edge catch, not a visible frame.
4. **Highlight**: A single `0.5px` inset top border simulating light catching the glass edge. This is the key to making glass feel physical.
5. **No colored glass**. Glass tints are always neutral (matching the surface color). Colored glass looks like a filter, not a material.
6. **Glass elements never have shadows heavier than `--shadow-md`**. Heavy shadows contradict the floating-glass illusion.
7. **Glass should feel like a physical pane**, not a blurred screenshot. The content behind should be recognizable but clearly separated.

---

## 9. Component Architecture

### 9.1 The Layered Model

Every page in Dusklight is built from four layers, in order:

```
┌─────────────────────────────────────────────────────┐
│  Layer 4: Page Layout                                │
│  (How components are arranged on THIS page)          │
├─────────────────────────────────────────────────────┤
│  Layer 3: Shared Components                          │
│  (Cards, Buttons, Tags, TOC, Code blocks...)         │
├─────────────────────────────────────────────────────┤
│  Layer 2: Global Shell                               │
│  (Header, Footer, ScrollProgress, BackToTop)         │
├─────────────────────────────────────────────────────┤
│  Layer 1: Design Tokens & CSS Foundation             │
│  (Colors, typography, spacing, glass, motion)        │
└─────────────────────────────────────────────────────┘
```

- **Layer 1** is defined in `src/styles/` and never changes per-page.
- **Layer 2** is present on every page, identical everywhere.
- **Layer 3** is the reusable component library — components are page-agnostic.
- **Layer 4** is the only thing that differs between pages — it's just layout composition.

### 9.2 Global Shell

The global shell wraps every page. It is not a layout component — it's the structural skeleton that provides spatial consistency.

```
┌─────────────────────────────────────────────┐
│  <Header />                    [Glass]       │  ← Every page, identical
├─────────────────────────────────────────────┤
│                                              │
│  <main>                                      │
│    <!-- Page content goes here -->           │  ← Only this section changes
│  </main>                                     │
│                                              │
├─────────────────────────────────────────────┤
│  <Footer />                    [Opaque]      │  ← Every page, identical
├─────────────────────────────────────────────┤
│  <ScrollProgress />                          │  ← Every page, identical
│  <BackToTop />                 [Glass]       │  ← Every page, identical
└─────────────────────────────────────────────┘
```

**Global Shell Components:**

| Component        | Surface | Glass? | Scope    | Description                                      |
| ---------------- | ------- | ------ | -------- | ------------------------------------------------ |
| `Header`         | Glass   | Yes    | Global   | Sticky navigation bar, identical on every page   |
| `Footer`         | Opaque  | No     | Global   | Site footer with copyright and social links      |
| `ScrollProgress` | —       | No     | Global   | Thin gradient bar at viewport top                |
| `BackToTop`      | Glass   | Yes    | Global   | Fixed circular button, bottom-right              |
| `ThemeToggle`    | Ghost   | No     | Global   | Icon-only toggle in the header                   |

**Shell Rules:**
- The Header is identical on every page — same height, same glass, same links, same behavior.
- The Footer is identical on every page — same content, same opaque surface.
- ScrollProgress and BackToTop appear on every page without exception.
- No page may override, hide, or restyle shell components.

### 9.3 Shared Components

These are the reusable building blocks. Every visual element on every page is one of these components (or a composition of them).

#### Primitives (Atomic)

| Component      | Surface | Glass? | Description                                      |
| -------------- | ------- | ------ | ------------------------------------------------ |
| `Button`       | Opaque  | No     | Primary (`--accent` bg) and secondary (ghost)    |
| `Tag`          | —       | No     | Accent-tinted pill, `--text-xs`, weight 500      |
| `Icon`         | —       | No     | Consistent SVG icon wrapper, 20px default        |
| `Divider`      | —       | No     | Gradient-fading horizontal rule                  |
| `Skeleton`     | —       | No     | Loading placeholder with pulse animation         |

#### Content Components

| Component      | Surface | Glass? | Description                                      |
| -------------- | ------- | ------ | ------------------------------------------------ |
| `Card`         | Opaque  | No     | Base card with surface-1 bg, border, radius-lg   |
| `PostCard`     | Opaque  | No     | Extends Card — adds cover, title, desc, meta     |
| `PostCardHero` | Opaque  | No     | Extends PostCard — horizontal layout variant     |
| `PostCardList` | Opaque  | No     | Compact vertical list of post titles + dates     |
| `ArticleMeta`  | —       | No     | Published date, updated date, category           |

#### Typography Components

| Component      | Surface | Glass? | Description                                      |
| -------------- | ------- | ------ | ------------------------------------------------ |
| `.prose`       | —       | No     | Global article typography wrapper                |
| `CodeBlock`    | Opaque  | No     | `--surface-1` bg, monospace, horizontal scroll   |
| `Blockquote`   | —       | No     | Left accent border, no background                |
| `HeadingAnchor`| —       | No     | Linked heading with hover-visible anchor         |

#### Overlay Components (Glass)

| Component      | Surface | Glass? | Description                                      |
| -------------- | ------- | ------ | ------------------------------------------------ |
| `TOC`          | Glass   | Yes    | Sticky sidebar, scroll-highlighted links         |
| `SearchDialog` | Glass   | Yes    | Modal search overlay                             |
| `MobileMenu`   | Glass   | Yes    | Full-width dropdown below header on mobile       |

### 9.4 Component Design Specifications

Every component below uses ONLY tokens from the design system. No component defines its own colors, spacing, or timing.

#### Card (Base)

The Card is the foundational content container. PostCard and PostCardHero extend it.

- **Background**: `--surface-1`
- **Border**: `1px solid --border-subtle`
- **Border radius**: `--radius-lg` (12px)
- **Padding**: `--space-6` (1.5rem)
- **Hover**: Shadow deepens from `--shadow-sm` to `--shadow-md`. No translateY. No scale.
- **Transition**: `box-shadow var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)`

> **Design decision**: Cards do NOT lift on hover (`translateY(-2px)`). This common pattern feels playful. Instead, the shadow deepens subtly — the card feels pressed into the surface, not jumping off it. This applies to ALL card variants everywhere.

#### PostCard (extends Card)

- **Cover image**: `aspect-ratio: 16/9`, `object-fit: cover`, `border-radius: var(--radius-md)` (inner radius, smaller than card)
- **Title**: `--text-md`, weight 600, `--foreground`, max 2 lines
- **Description**: `--text-sm`, `--foreground-secondary`, max 2 lines
- **Meta**: `--text-xs`, `--foreground-muted`
- **Tags**: Uses the shared `Tag` component

#### PostCardHero (extends PostCard)

A wider variant for featured content. Same tokens, different layout.

- **Layout**: Horizontal on desktop (image 45%, content 55%), vertical on mobile
- **Title**: `--text-lg` (larger than default PostCard)
- **Description**: max 3 lines (more than default PostCard)

#### Button

Two variants, same base structure:

- **Primary**: `background: --accent`, `color: --surface-0`, `border-radius: --radius-md`, `padding: --space-2 --space-4`
- **Secondary**: `background: transparent`, `color: --foreground`, `border: 1px solid --border`
- **Hover**: Primary darkens to `--accent-dim`. Secondary gets `--surface-2` background.
- **Active**: `transform: scale(0.98)` — subliminal press feedback
- **Transition**: `all var(--duration-fast) var(--ease-standard)`

#### Tag

- **Background**: `--accent-subtle` (accent at 12% opacity)
- **Color**: `--accent`
- **Border radius**: `--radius-full` (pill shape)
- **Padding**: `--space-1 --space-3`
- **Font**: `--text-xs`, weight 500
- **Hover**: Background intensifies to `--accent` at 20% opacity

#### Navigation (Header)

- **Position**: Sticky top, `z-index: 50`
- **Height**: `64px` desktop, `56px` mobile
- **Surface**: Glass (uses `--glass-*` tokens)
- **Logo**: `--text-md`, weight 700, `--foreground`
- **Nav links**: `--text-sm`, weight 500, `--foreground-secondary` default, `--foreground` hover, `--accent` active
- **Active indicator**: `2px` bottom border in `--accent`, or subtle `--accent-subtle` background tint
- **Mobile menu**: Glass dropdown, slide-down with `--ease-entrance`

#### Table of Contents (TOC)

- **Surface**: Glass
- **Position**: Sticky, `top: calc(--header-height + --space-4)`
- **Active link**: `--accent` color + `2px` left border in `--accent`
- **Inactive link**: `--foreground-muted`, hover → `--foreground`
- **Indentation**: h3 items get `--space-4` left padding, h4 get `--space-8`
- **Collapse**: Animated with `--ease-standard`, `--duration-normal`

#### Article Typography (`.prose`)

The `.prose` class is used on every page that renders long-form text — articles AND the about page. It is the single source of truth for content typography.

- **Paragraphs**: `--text-base`, line-height `1.75`, margin-bottom `1.25em`
- **Links**: `--accent` color, underline on hover only
- **Strong/Bold**: weight 600 (not 700 — 700 is headings only)
- **Images**: Full-width breakout, `border-radius: var(--radius-md)`, `margin: 2.5rem 0`
- **Lists**: Indented `1.5em`, marker color `--foreground-muted`
- **Horizontal rules**: `--divider` component, `margin: 3rem 0`
- **Tables**: `--surface-1` header bg, `--border-subtle` cell borders, horizontal scroll
- **Code inline**: `--text-sm`, weight 500, `--font-mono`, `--surface-2` bg pill
- **Code blocks**: `--surface-1` bg, `--radius-md`, `padding: --space-5`

### 9.5 Interaction Patterns

These patterns are shared across all components. No component invents its own interaction style.

| Pattern              | Implementation                                                  |
| -------------------- | --------------------------------------------------------------- |
| **Hover feedback**   | Shadow deepening or background shift. No translateY lift.       |
| **Active feedback**  | `scale(0.98)`. Subliminal — the user shouldn't consciously notice. |
| **Focus indicator**  | `2px` outline in `--accent` with `2px` offset. Visible, not decorative. |
| **Loading state**    | Skeleton pulse animation. No spinners.                          |
| **Entrance**         | `opacity: 0→1` + `translateY(8px→0)`, `--ease-entrance`, staggered 60ms. |
| **Exit**             | `opacity: 1→0` + `translateY(0→-4px)`, `--ease-exit`.          |
| **Glass hover**      | Background opacity increase only. No transform, no shadow change. |
| **Link hover**       | Color shift to `--accent-bright`. No underline animation.       |
| **Card click**       | Entire card is wrapped in `<a>`. No separate click target needed. |

### 9.6 Component Dependency Map

```
Design Tokens (Layer 1)
    │
    ├── Glass System ──────────► Header, TOC, BackToTop, SearchDialog, MobileMenu
    │
    ├── Surface System ────────► Card, Footer, CodeBlock
    │
    ├── Typography System ─────► .prose, Heading, PostCard, ArticleMeta
    │
    ├── Spacing System ────────► All components
    │
    ├── Motion System ─────────► All interactive components
    │
    └── Color System ──────────► All components

Shared Components (Layer 3)
    │
    ├── Card ──────────────────► PostCard ──────► PostCardHero
    │                            PostCardList
    │
    ├── Button ────────────────► (used directly in Header, Footer, articles)
    │
    ├── Tag ───────────────────► PostCard, ArticleHeader
    │
    ├── .prose ────────────────► BlogPost layout, About page
    │
    └── Divider ───────────────► PostCard, ArticleHeader, Section breaks

Global Shell (Layer 2)
    │
    ├── Header
    │   ├── Logo
    │   ├── NavLink (×N)
    │   ├── ThemeToggle
    │   └── MobileMenu (toggled)
    │
    ├── Footer
    │   ├── Copyright
    │   └── SocialLink (×N)
    │
    ├── ScrollProgress
    └── BackToTop
```

### 9.7 Variant System

Components use **variants** (not one-off overrides) to adapt to different contexts. Variants are controlled via a `variant` prop or CSS modifier class.

**Allowed variant mechanism**: A single `variant` prop that selects from a predefined set. No arbitrary className passing.

Examples:
- `PostCard` has variants: `default`, `hero` (horizontal layout)
- `Button` has variants: `primary`, `secondary`
- `Card` has variants: `default` (used by PostCard and PostCardHero)

**Forbidden**: Creating a "special" version of a component for a single page. If a page needs a component that looks different, either:
1. Add a new variant to the existing component, OR
2. Compose the visual difference from existing primitives

### 9.8 Anti-Patterns

These are explicitly forbidden:

1. **Page-specific styles that override component tokens.** If a card looks wrong on the about page, the card design is wrong — fix the card, don't override it.
2. **Different card styles on different pages.** A PostCard on the homepage and a PostCard on the archive page use identical styles.
3. **Different button styles on different pages.** The primary button is the same everywhere.
4. **Different spacing on different pages.** The `--space-*` tokens are universal.
5. **Different glass on different pages.** The glass specification is universal.
6. **Inline styles.** Everything goes through tokens and scoped CSS.
7. **One-off color values.** If a color doesn't exist in the token system, add it to the token system.

---

## 10. Responsive Strategy

### 10.1 Breakpoints

We use a mobile-first approach with four breakpoints:

```css
/* Mobile first — base styles */
/* sm */  @media (min-width: 640px)  { /* Large phones, small tablets */ }
/* md */  @media (min-width: 768px)  { /* Tablets */ }
/* lg */  @media (min-width: 1024px) { /* Small laptops */ }
/* xl */  @media (min-width: 1280px) { /* Desktops */ }
```

### 10.2 Responsive Rules

1. **Content width never exceeds `680px`** for article text, regardless of viewport width.
2. **Page width never exceeds `1200px`** for the overall layout.
3. **On mobile (<768px)**: Single column layout everywhere. TOC moves inline above the article (collapsible). Navigation becomes hamburger + dropdown. Glass blur reduces to `12px` for performance.
4. **On tablet (768px–1023px)**: Two-column layout for homepage. Article layout remains single column with inline TOC.
5. **On desktop (1024px+)**: Full asymmetric layouts. Sidebar TOC appears. Navigation links visible.
6. **On ultra-wide (>1440px)**: Content centers with generous margins. No stretching.

### 10.3 Fluid Typography

Use `clamp()` for fluid scaling between breakpoints:

```css
--text-2xl: clamp(2.0rem, 1.5rem + 2.5vw, 3.052rem);
--text-xl:  clamp(1.75rem, 1.25rem + 2.0vw, 2.441rem);
--text-lg:  clamp(1.375rem, 1.125rem + 1.25vw, 1.953rem);
--text-md:  clamp(1.125rem, 1.0rem + 0.5vw, 1.25rem);
--text-base: clamp(0.9375rem, 0.875rem + 0.25vw, 1rem);
```

### 10.4 Container Queries

Use CSS container queries for component-level responsiveness (cards, sidebar) instead of viewport media queries where appropriate.

---

## 11. Design Tokens

All design decisions are encoded as CSS custom properties (tokens). Tokens follow a strict naming convention:

```
--{category}-{property}-{variant}
```

### 11.1 Complete Token List

```css
:root {
  /* ── Accent ── */
  --hue: 250;

  /* ── Surfaces ── */
  --surface-0:  /* page bg */
  --surface-1:  /* cards, content */
  --surface-2:  /* hover, active */
  --surface-3:  /* modals, dropdowns */

  /* ── Text ── */
  --foreground:
  --foreground-secondary:
  --foreground-muted:

  /* ── Accent ── */
  --accent:
  --accent-dim:
  --accent-bright:
  --accent-subtle:

  /* ── Borders ── */
  --border:
  --border-subtle:

  /* ── Shadows ── */
  --shadow-sm:    /* subtle depth */
  --shadow-md:    /* moderate elevation */
  --shadow-lg:    /* high elevation */
  --shadow-xl:    /* maximum elevation */

  /* ── Glass ── */
  --glass-bg:
  --glass-border:
  --glass-blur:         /* 16px */
  --glass-saturation:   /* 160% */
  --glass-highlight:

  /* ── Radius ── */
  --radius-sm:    6px;
  --radius-md:    8px;
  --radius-lg:    12px;
  --radius-xl:    16px;
  --radius-full:  9999px;

  /* ── Spacing ── */
  --space-1:    0.25rem;   /* 4px */
  --space-2:    0.5rem;    /* 8px */
  --space-3:    0.75rem;   /* 12px */
  --space-4:    1rem;      /* 16px */
  --space-5:    1.25rem;   /* 20px */
  --space-6:    1.5rem;    /* 24px */
  --space-8:    2rem;      /* 32px */
  --space-10:   2.5rem;    /* 40px */
  --space-12:   3rem;      /* 48px */
  --space-16:   4rem;      /* 64px */
  --space-20:   5rem;      /* 80px */
  --space-24:   6rem;      /* 96px */

  /* ── Typography ── */
  --font-display:
  --font-body:
  --font-mono:

  /* ── Duration ── */
  --duration-instant:  100ms;
  --duration-fast:     150ms;
  --duration-normal:   250ms;
  --duration-slow:     400ms;
  --duration-lazy:     600ms;

  /* ── Easing ── */
  --ease-standard:  cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-entrance:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit:      cubic-bezier(0.7, 0, 0.84, 0);
  --ease-physical:  cubic-bezier(0.32, 0.72, 0, 1);

  /* ── Layout ── */
  --page-width:      1200px;
  --content-width:   680px;
  --header-height:   64px;
}
```

### 11.2 Token Rules

1. **No magic numbers.** Every size, color, and timing value must reference a token. If a value doesn't have a token, create one.
2. **Tokens are semantic.** `--surface-1` not `--gray-100`. Tokens describe purpose, not appearance.
3. **Dark mode overrides surface, text, and border tokens only.** Spacing, radius, timing, and layout tokens are theme-agnostic.

---

## 12. CSS Architecture

### 12.1 File Structure

```
src/styles/
├── tokens.css          /* All CSS custom properties (design tokens) */
├── reset.css           /* Minimal CSS reset */
├── base.css            /* Global element styles (html, body, a, h1-h6, etc.) */
├── typography.css      /* .prose class for article content */
├── glass.css           /* Glass effect utilities */
├── animations.css      /* Keyframes and animation utilities */
├── utilities.css       /* Helper classes (.sr-only, .truncate, etc.) */
└── global.css          /* Imports all of the above in order */
```

### 12.2 Import Order

```css
/* global.css */
@import "./tokens.css";
@import "./reset.css";
@import "./base.css";
@import "./typography.css";
@import "./glass.css";
@import "./animations.css";
@import "./utilities.css";
```

### 12.3 CSS Rules

1. **No Tailwind. No utility-first framework.** Dusklight uses hand-written CSS with a token-driven approach. This is a deliberate choice for maximum control over the design language.
2. **No `!important`** except in the `prefers-reduced-motion` media query.
3. **Component styles are scoped** using Astro's `<style>` blocks. Global styles live only in `src/styles/`.
4. **No CSS-in-JS.** No styled-components. CSS is CSS.
5. **BEM-inspired naming**: `.block__element--modifier`. Example: `.post-card__title--featured`.
6. **No deep nesting.** Maximum 2 levels of nesting in CSS. If you need more, restructure the selectors.
7. **Comment every non-obvious decision.** If a value isn't from the token system, explain why in a comment.
8. **Mobile-first**: Base styles target mobile. Desktop enhancements use `min-width` media queries.
9. **Container queries over media queries** for component-level responsiveness where browser support allows.

### 12.4 Legacy Cleanup

The following files will be removed during implementation:

- `src/styles/glass.css` — replaced by the new `glass.css` with stricter rules
- `src/assets/fonts/atkinson-*.woff` — replaced by Inter variable font
- All existing `--color-*` variables — replaced by semantic tokens
- All `--border-radius*` variables — replaced by `--radius-*` tokens

---

## 13. Page Compositions

Pages are **compositions** of the shared components defined in Section 9. They differ only in layout — not in visual language.

Every page uses:
- The same Header (glass nav)
- The same Footer (opaque)
- The same ScrollProgress + BackToTop
- The same typography system (`.prose` for content)
- The same card, button, tag, and divider components
- The same spacing, radius, shadow, and glass tokens

What changes between pages is **which components appear and how they're arranged**.

### 13.1 Homepage Layout Concept

#### Structure

```
┌─────────────────────────────────────────────────────────┐
│  [Glass Navigation Bar — sticky]                         │
│  Logo          Home  Archive  About      [Theme]  [☰]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ Hero Section ────────────────────────────────────┐   │
│  │                                                    │   │
│  │  Dusklight                                         │   │
│  │  Sharing technology, life, and thought.            │   │
│  │                                                    │   │
│  │  (Large title, subtitle, generous whitespace)      │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Latest Writing ──────────────────────────────────┐   │
│  │                                                    │   │
│  │  ┌─ Featured Post (60%) ─┐  ┌─ Post List (40%) ─┐ │   │
│  │  │                        │  │                    │ │   │
│  │  │  [Cover Image]         │  │  Post 2  [date]    │ │   │
│  │  │                        │  │  ─────────────     │ │   │
│  │  │  Title                 │  │  Post 3  [date]    │ │   │
│  │  │  Description           │  │  ─────────────     │ │   │
│  │  │  Date · Category       │  │  Post 4  [date]    │ │   │
│  │  │                        │  │  ─────────────     │ │   │
│  │  └────────────────────────┘  │  Post 5  [date]    │ │   │
│  │                               └────────────────────┘ │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Recent Posts (asymmetric grid) ──────────────────┐   │
│  │                                                    │   │
│  │  ┌─ Card ─────┐  ┌─ Card ─────┐                   │   │
│  │  │             │  │             │                   │   │
│  │  └─────────────┘  └─────────────┘                   │   │
│  │          ┌─ Card ─────┐  ┌─ Card ─────┐            │   │
│  │          │             │  │             │            │   │
│  │          └─────────────┘  └─────────────┘            │   │
│  │  (Staggered grid — alternating column offsets)       │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Footer ──────────────────────────────────────────┐   │
│  │  © 2026 mcxiaochen           GitHub    RSS         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Components Used

| Slot             | Component(s)                      | Notes                                     |
| ---------------- | --------------------------------- | ----------------------------------------- |
| Header           | `Header` (global shell)           | Identical to all other pages              |
| Hero             | Plain HTML + typography tokens    | No component — just styled `<h1>` + `<p>` |
| Featured post    | `PostCardHero`                    | Horizontal variant of PostCard            |
| Post list        | `PostCardList`                    | Compact title+date list                   |
| Recent posts     | `PostCard` (×4)                   | Default variant, asymmetric grid          |
| "View all" link  | `Button` (secondary variant)      | Ghost style, text link feel               |
| Footer           | `Footer` (global shell)           | Identical to all other pages              |

#### Rules

1. **Hero section**: Uses typography tokens directly (`--text-2xl`, `--text-lg`). No dedicated hero component — it's just styled markup on `--surface-0`.
2. **Featured post**: Uses the shared `PostCardHero` component. Same card tokens as everywhere else.
3. **Post list**: Uses the shared `PostCardList` component. Same typography and spacing tokens.
4. **Recent posts grid**: Uses the shared `PostCard` component in default variant. The asymmetric grid is a layout concern (CSS Grid on the page), not a component concern.
5. **No "Load More" button on initial design.** Show the 6 most recent posts. A `Button` (secondary variant) at the bottom leads to the archive page.

---

## 14. Article Page Composition

#### Components Used

| Slot             | Component(s)                      | Notes                                     |
| ---------------- | --------------------------------- | ----------------------------------------- |
| Header           | `Header` (global shell)           | Identical to all other pages              |
| Cover image      | Plain `<img>` with breakout CSS   | Full-width, no card wrapper               |
| Tags             | `Tag` (×N)                        | Same Tag component used on PostCards       |
| Title            | Styled `<h1>` with typography tokens | No dedicated component                 |
| Meta line        | `ArticleMeta`                     | Published/updated dates                   |
| Content body     | `.prose` wrapper                  | Same prose typography as About page       |
| Code blocks      | `CodeBlock`                       | Same code style everywhere                |
| TOC              | `TOC` (glass overlay)             | Same glass tokens as Header               |
| Footer           | `Footer` (global shell)           | Identical to all other pages              |

#### Structure

```
┌─────────────────────────────────────────────────────────┐
│  [Glass Navigation Bar]                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ Article ──────────────────────┐  ┌─ TOC ──────────┐ │
│  │                                 │  │  [Glass]        │ │
│  │  [Optional Cover Image]         │  │                 │ │
│  │  (full-width breakout)          │  │  ● Section 1   │ │
│  │                                 │  │    Sub 1.1     │ │
│  │  Tag1  Tag2                     │  │    Sub 1.2     │ │
│  │                                 │  │  ● Section 2   │ │
│  │  Article Title                  │  │  ● Section 3   │ │
│  │  (large, confident)             │  │                 │ │
│  │                                 │  │                 │ │
│  │  Published Jan 1, 2026          │  │                 │ │
│  │  Updated Mar 15, 2026           │  │                 │ │
│  │                                 │  │                 │ │
│  │  ─────────────────────────────  │  │                 │ │
│  │                                 │  │                 │ │
│  │  Article body text begins       │  │                 │ │
│  │  here. Comfortable line length. │  │                 │ │
│  │  Generous paragraph spacing.    │  │                 │ │
│  │                                 │  │                 │ │
│  │  ## Section Heading             │  │                 │ │
│  │                                 │  │                 │ │
│  │  More content follows with      │  │                 │ │
│  │  beautiful typography.          │  │                 │ │
│  │                                 │  │                 │ │
│  │  ┌─ Code Block ─────────────┐  │  │                 │ │
│  │  │  const x = "hello";      │  │  │                 │ │
│  │  │  console.log(x);         │  │  │                 │ │
│  │  └──────────────────────────┘  │  │                 │ │
│  │                                 │  │                 │ │
│  │  > A pullquote that extends     │  │                 │ │
│  │  beyond the content column      │  │                 │ │
│  │  into the margin.               │  │                 │ │
│  │                                 │  │                 │ │
│  └─────────────────────────────────┘  └─────────────────┘ │
│                                                          │
│  ┌─ Footer ──────────────────────────────────────────┐   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Rules

1. **Cover image**: Full-viewport-width breakout. Below the image, the content column begins with generous top padding. This is a layout concern — the image itself is a plain `<img>` with breakout CSS.
2. **Tags**: Uses the shared `Tag` component. Same pills used on PostCards, same tokens everywhere.
3. **Title**: Typography tokens only (`--text-2xl`, weight 700, `letter-spacing: -0.025em`). No special title component.
4. **Meta line**: Uses the shared `ArticleMeta` component. `--text-sm`, `--foreground-muted`.
5. **Content divider**: Uses the shared `Divider` component (gradient-fading horizontal rule).
6. **TOC**: Uses the shared `TOC` component with the standard glass specification. Same glass as Header. On screens <1024px, it collapses to an inline expandable section above the article content.
7. **Pull quotes**: Styled within `.prose` using typography tokens (`--text-lg`, weight 300, `--foreground-secondary`). Extend beyond the content column via negative margin — a layout technique, not a separate component.
8. **Code blocks**: Uses the shared `CodeBlock` component. Same `--surface-1` bg, same `--radius-md`, same monospace tokens.
9. **Images in content**: Styled within `.prose` — breakout via negative margin, `border-radius: var(--radius-md)`.

---

## 15. About Page Composition

#### Components Used

| Slot             | Component(s)                      | Notes                                     |
| ---------------- | --------------------------------- | ----------------------------------------- |
| Header           | `Header` (global shell)           | Identical to all other pages              |
| Hero name        | Styled `<h1>` with typography tokens | Same `--text-2xl` as article titles    |
| Bio line         | Styled `<p>` with typography tokens  | `--text-lg`, weight 300                |
| Avatar           | Plain `<img>` with radius tokens  | `--radius-lg`, not a special component    |
| About text       | `.prose` wrapper                  | Same prose typography as articles         |
| Skills list      | `Tag` (×N) or inline text list    | Reuses the shared Tag component           |
| Links            | Styled `<a>` with typography tokens | Standard link styles from base.css      |
| Footer           | `Footer` (global shell)           | Identical to all other pages              |

#### Structure

```
┌─────────────────────────────────────────────────────────┐
│  [Glass Navigation Bar]                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ Hero Statement ─────────────────────────────────┐   │
│  │                                                    │   │
│  │  mcxiaochen                                        │   │
│  │  (Large display name, --text-2xl)                  │   │
│  │                                                    │   │
│  │  A one-line bio in --text-lg, weight 300           │   │
│  │  (--foreground-secondary)                          │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Content (two-column asymmetric) ────────────────┐   │
│  │                                                    │   │
│  │  ┌─ Left (60%) ───────────┐  ┌─ Right (40%) ──┐  │   │
│  │  │                        │  │                  │  │   │
│  │  │  ## About              │  │  [Avatar]        │  │   │
│  │  │                        │  │  (rounded,       │  │   │
│  │  │  Long-form text about  │  │   not circular)  │  │   │
│  │  │  yourself. Written in  │  │                  │  │   │
│  │  │  the same .prose       │  │  ── Skills ──    │  │   │
│  │  │  typography as         │  │                  │  │   │
│  │  │  articles.             │  │  TypeScript      │  │   │
│  │  │                        │  │  React           │  │   │
│  │  │  ## Interests          │  │  Astro           │  │   │
│  │  │                        │  │  Node.js         │  │   │
│  │  │  More content here.    │  │                  │  │   │
│  │  │                        │  │  ── Links ──     │  │   │
│  │  │                        │  │                  │  │   │
│  │  │                        │  │  GitHub →        │  │   │
│  │  │                        │  │  RSS →           │  │   │
│  │  └────────────────────────┘  └──────────────────┘  │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Footer ──────────────────────────────────────────┐   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Rules

1. **Hero**: Uses typography tokens directly (`--text-2xl`, `letter-spacing: -0.03em`). No dedicated component — same approach as the homepage hero.
2. **Avatar**: Uses `--radius-lg` (same border-radius as cards). NOT a circle — circles are cliché for personal blogs. `width: 200px` on desktop, `120px` on mobile.
3. **Content**: Uses the same `.prose` class as articles. This is the same typography system — the about page is an article in terms of reading experience.
4. **Skills**: Uses the shared `Tag` component. Same pills used on PostCards.
5. **Links**: Standard `<a>` styles from `base.css`. No special link component.
6. **No glass elements.** The about page uses only opaque surfaces (`--surface-0`, `--surface-1`). Glass is for overlays, not content pages.

---

## 16. Future Implementation Plan

This design constitution covers Phase 1 of the Dusklight rebuild. The following phases are outlined for future reference but should not be implemented yet.

### Phase 1: Design Tokens & CSS Foundation (Current Phase)

Build the visual foundation that everything else depends on. No components, no pages — just the language.

- [x] Design Constitution (this document)
- [ ] Install Inter variable font, remove Atkinson
- [ ] Create `tokens.css` — all design tokens (colors, spacing, radius, shadow, glass, motion, typography)
- [ ] Create `reset.css` — minimal CSS reset
- [ ] Create `base.css` — global element styles (html, body, a, h1-h6, img, code, etc.)
- [ ] Create `typography.css` — `.prose` class for article/content typography
- [ ] Rewrite `glass.css` — new glass specification (stricter, fewer utilities)
- [ ] Create `animations.css` — keyframes and animation utilities
- [ ] Create `utilities.css` — helper classes (.sr-only, .truncate, etc.)
- [ ] Rewrite `global.css` — import aggregator for all stylesheets
- [ ] Remove legacy CSS variables and Atkinson font files

### Phase 2: Global Shell Components

Build the components that appear on every page. These are the skeleton.

- [ ] Rewrite `Header` component (glass nav, responsive, mobile menu)
- [ ] Update `ThemeToggle` component (uses new token system)
- [ ] Rewrite `Footer` component (opaque, minimal)
- [ ] Rewrite `ScrollProgress` component
- [ ] Create `BackToTop` component (glass button)
- [ ] Create `BaseLayout.astro` — the global shell layout (Header + slot + Footer + ScrollProgress + BackToTop)

### Phase 3: Shared Components

Build the reusable component library. Every visual element used on any page lives here.

- [ ] Create `Button` component (primary + secondary variants)
- [ ] Create `Tag` component (accent-tinted pill)
- [ ] Create `Divider` component (gradient-fading horizontal rule)
- [ ] Create `Card` component (base card with surface-1 bg)
- [ ] Rewrite `PostCard` component (extends Card, default + hero variants)
- [ ] Create `PostCardList` component (compact title+date list)
- [ ] Create `ArticleMeta` component (published/updated dates)
- [ ] Rewrite `TOC` component (glass sidebar, scroll highlight)
- [ ] Create `CodeBlock` component (surface-1 bg, monospace)
- [ ] Create `Blockquote` component (accent left border)

### Phase 4: Page Compositions

Assemble pages from shared components. No new visual design — just layout.

- [ ] Rewrite Homepage (asymmetric composition of PostCardHero + PostCardList + PostCard grid)
- [ ] Rewrite Article page (editorial composition with .prose + TOC + ArticleMeta)
- [ ] Rewrite About page (editorial composition with .prose + Tag + Avatar)
- [ ] Rewrite Archive page (composition with PostCardList or grouped headings)
- [ ] Rewrite Tags page (composition with Tag + PostCardList)

### Phase 5: Enhanced Features

Add features that enhance the existing system without changing the visual language.

- [ ] Search functionality (glass dialog — uses existing glass tokens)
- [ ] Reading time estimation
- [ ] Table of contents with progress indicator
- [ ] Image lightbox
- [ ] Code block copy button
- [ ] Syntax highlighting theme customization

### Phase 6: Polish & Performance

- [ ] View Transitions API integration
- [ ] Scroll-driven animations
- [ ] Image optimization pipeline
- [ ] Font subsetting
- [ ] Critical CSS inlining
- [ ] Accessibility audit

### Phase 7: Content & Deployment

- [ ] RSS feed styling
- [ ] SEO optimization
- [ ] Sitemap generation
- [ ] GitHub Actions CI/CD
- [ ] Content migration from existing posts
- [ ] ICP filing footer

---

## Appendix A: Quick Reference

### When to Use Glass

Ask yourself: *"Does this element float above content?"*

- Yes → Glass
- No → Opaque surface

### When to Break the Grid

Ask yourself: *"Does this element need to command attention or create rhythm?"*

- Yes → Break out
- No → Stay in the column

### When to Use Accent Color

Ask yourself: *"Is this the most important interactive element in this context?"*

- Yes → Use `--accent`
- No → Use `--foreground-secondary`

### Design Review Checklist

Before merging any visual change:

- [ ] **System consistency**: Does this use existing shared components? If it's a new component, does it reuse existing tokens?
- [ ] **Cross-page consistency**: Would this look identical if placed on a different page?
- [ ] Does it work in dark mode? (Primary target)
- [ ] Does it work in light mode?
- [ ] Does it respect `prefers-reduced-motion`?
- [ ] Does it use design tokens (no magic numbers)?
- [ ] Is the text contrast ratio ≥ 7:1 for body text?
- [ ] Does it look good at 320px, 768px, 1024px, and 1440px?
- [ ] Does it feel calm, not flashy?
- [ ] Would it look appropriate in a premium editorial publication?

**The acid test**: If you showed this component on the homepage, article page, and about page, would it look like it belongs on all three? If not, something is wrong with either the component or the page — but the component should win.

---

*"The details are not the details. They make the design."* — Charles Eames
