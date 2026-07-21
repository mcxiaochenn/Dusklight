# Dusklight 博客重构计划

> 基于 Astro 7 框架，采用 Apple 液态玻璃美学，打造现代化个人博客

---

## 📋 项目概述

**目标站点**: https://blog.mcxiaochen.top
**框架**: Astro 7.x (当前 7.1.3)
**设计语言**: Apple Liquid Glass + HIG Layout
**包管理器**: pnpm
**部署方式**: GitHub Actions → gh-pages 分支 → Vercel/GitHub Pages

---

## 🏗️ 目录结构设计（跨仓库内容分离）

### 仓库架构

```
┌─────────────────────────────────────────────────────────────┐
│                    框架仓库 (Dusklight)                       │
│  包含：组件、样式、配置、构建脚本                               │
│  内容目录 content/ 在 .gitignore 中排除                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ clone + symlink
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   内容仓库 (Dusklight-Content)                │
│  包含：博客文章、页面内容、图片、结构化数据                       │
│  独立版本控制，可单独编辑                                      │
└─────────────────────────────────────────────────────────────┘
```

### 框架仓库结构

```
Dusklight/                          # 框架仓库
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       └── deploy.yml
├── scripts/
│   ├── sync-content.js             # 内容同步脚本
│   ├── load-env.js                 # .env 解析器
│   └── new-post.js                 # 新建文章脚本
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── images/
│   │       └── site/               # 框架级图片（logo 等）
│   ├── components/
│   │   ├── common/
│   │   ├── blog/
│   │   ├── home/
│   │   └── seo/
│   ├── config/
│   ├── content/                    # ← symlink 指向 content/blog
│   ├── content.config.ts
│   ├── data/                       # ← symlink 指向 content/data
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   └── utils/
├── content/                        # ← 克隆的内容仓库（gitignored）
├── .env.example                    # 环境变量示例
├── .gitignore                      # 排除 /content/
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

### 内容仓库结构

```
Dusklight-Content/                  # 内容仓库（独立 Git 仓库）
├── .github/
│   └── workflows/
│       └── trigger-build.yml       # 内容更新时触发框架仓库构建
├── blog/                           # 博客文章
│   ├── hello-world/
│   │   ├── index.md
│   │   └── cover.jpg
│   └── astro-guide/
│       ├── index.mdx
│       └── assets/
├── pages/                          # 独立页面（关于、友链等）
│   └── about.md
├── data/                           # 结构化数据
│   ├── friends.yaml
│   └── projects.yaml
├── images/                         # 共享图片资源
├── LICENSE
└── README.md
```

### Symlink 映射关系

| 内容仓库路径 | → | 框架仓库路径 | 说明 |
|-------------|---|-------------|------|
| `content/blog/` | → | `src/content/` | 博客文章 |
| `content/pages/` | → | `src/content/pages/` | 独立页面 |
| `content/data/` | → | `src/data/` | 结构化数据 |
| `content/images/` | → | `public/images/` | 图片资源 |

---

## 📂 Phase 0: 跨仓库内容分离实现

> 参考 Mizuki 的 clone + symlink 机制，内容仓库独立于框架仓库

### 0.1 创建内容仓库

首先在 GitHub 创建独立的内容仓库：`Dusklight-Content`

**内容仓库结构**：
```
Dusklight-Content/
├── .github/
│   └── workflows/
│       └── trigger-build.yml       # 内容更新时触发框架仓库构建
├── blog/                           # 博客文章
│   ├── hello-world/
│   │   ├── index.md
│   │   └── cover.jpg
│   └── _drafts/                    # 草稿（不参与构建）
├── pages/                          # 独立页面
│   └── about.md
├── data/                           # 结构化数据
│   └── friends.yaml
├── images/                         # 共享图片
├── LICENSE
└── README.md
```

### 0.2 环境变量配置

创建 `.env.example` 和 `.env`：

```bash
# .env.example
# ===== 内容同步配置 =====

# 是否启用内容同步（false = 使用本地 content/ 目录）
ENABLE_CONTENT_SYNC=true

# 内容仓库地址（HTTPS 或 SSH）
CONTENT_REPO_URL=https://github.com/mcxiaochen/Dusklight-Content.git
# SSH 方式：
# CONTENT_REPO_URL=git@github.com:mcxiaochen/Dusklight-Content.git

# 内容目录（默认 ./content）
CONTENT_DIR=./content

# 内容仓库分支
CONTENT_BRANCH=main
```

### 0.3 内容同步脚本

创建 `scripts/sync-content.js`：

```javascript
// scripts/sync-content.js
// 参考 Mizuki 实现：clone + symlink 方式同步内容仓库

import { execSync } from "child_process";
import { existsSync, mkdirSync, rmSync, symlinkSync, cpSync, readFileSync } from "fs";
import { join, resolve, relative, dirname } from "path";

// ===== 加载 .env 配置 =====
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return {};

  const env = {};
  const content = readFileSync(envPath, "utf-8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // 去除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

// ===== 创建符号链接 =====
function createSymlink(src, dest) {
  // 如果目标已存在，先备份
  if (existsSync(dest)) {
    const backup = dest + ".backup";
    console.log(`  📦 备份已存在: ${dest} -> ${backup}`);
    rmSync(backup, { recursive: true, force: true });
    cpSync(dest, backup, { recursive: true });
    rmSync(dest, { recursive: true, force: true });
  }

  // 确保父目录存在
  mkdirSync(dirname(dest), { recursive: true });

  try {
    // 尝试创建符号链接（junction 在 Windows 上不需要管理员权限）
    const relPath = relative(dirname(dest), src);
    symlinkSync(relPath, dest, "junction");
    console.log(`  🔗 符号链接: ${src} -> ${dest}`);
  } catch (err) {
    // 如果符号链接失败，回退到文件复制
    console.log(`  ⚠️ 符号链接失败，使用文件复制: ${err.message}`);
    cpSync(src, dest, { recursive: true });
    console.log(`  📁 已复制: ${src} -> ${dest}`);
  }
}

// ===== 主同步逻辑 =====
async function main() {
  const env = loadEnv();

  // 检查是否启用同步
  if (env.ENABLE_CONTENT_SYNC !== "true") {
    console.log("⏭️  内容同步已禁用，使用本地 content/ 目录");
    process.exit(0);
  }

  const repoUrl = env.CONTENT_REPO_URL;
  if (!repoUrl) {
    console.error("❌ 未配置 CONTENT_REPO_URL");
    process.exit(1);
  }

  const contentDir = resolve(process.cwd(), env.CONTENT_DIR || "./content");
  const branch = env.CONTENT_BRANCH || "main";

  console.log("🔄 同步内容仓库...");

  // 克隆或更新内容仓库
  if (!existsSync(join(contentDir, ".git"))) {
    console.log(`📥 克隆内容仓库: ${repoUrl}`);
    execSync(`git clone --depth 1 -b ${branch} "${repoUrl}" "${contentDir}"`, {
      stdio: "inherit",
    });
  } else {
    console.log("📥 更新内容仓库...");
    try {
      execSync(`cd "${contentDir}" && git stash push --include-untracked`, {
        stdio: "pipe",
      });
    } catch {
      // stash 失败忽略
    }
    execSync(`cd "${contentDir}" && git fetch --all --prune`, { stdio: "pipe" });
    execSync(`cd "${contentDir}" && git checkout ${branch} && git reset --hard origin/${branch}`, {
      stdio: "inherit",
    });
  }

  // 创建符号链接映射
  const mappings = [
    { src: join(contentDir, "blog"), dest: resolve("src/content") },
    { src: join(contentDir, "pages"), dest: resolve("src/content/pages") },
    { src: join(contentDir, "data"), dest: resolve("src/data") },
    { src: join(contentDir, "images"), dest: resolve("public/images") },
  ];

  console.log("\n📂 创建内容映射...");
  for (const { src, dest } of mappings) {
    if (existsSync(src)) {
      createSymlink(src, dest);
    } else {
      console.log(`  ⏭️  跳过（不存在）: ${src}`);
    }
  }

  console.log("\n✅ 内容同步完成！");
}

main().catch((err) => {
  console.error("❌ 同步失败:", err.message);
  process.exit(1);
});
```

### 0.4 package.json 脚本集成

```json
{
  "scripts": {
    "sync-content": "node scripts/sync-content.js",
    "init-content": "echo '请在 .env 中配置 CONTENT_REPO_URL 后运行 pnpm sync-content'",
    "predev": "node scripts/sync-content.js || true",
    "prebuild": "node scripts/sync-content.js || true",
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

### 0.5 框架仓库 .gitignore

```gitignore
# 构建输出
dist/
.astro/

# 依赖
node_modules/

# 内容仓库（通过 symlink 映射）
/content/
*.backup

# 环境变量
.env
.env.production

# 系统文件
.DS_Store
.idea/
```

### 0.6 内容仓库自动触发构建

在内容仓库创建 `.github/workflows/trigger-build.yml`：

```yaml
# Dusklight-Content/.github/workflows/trigger-build.yml
name: Trigger Framework Build

on:
  push:
    branches: [main]
    paths:
      - "blog/**"
      - "pages/**"
      - "data/**"
      - "images/**"

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Repository Dispatch
        uses: peter-evans/repository-dispatch@v3
        with:
          token: ${{ secrets.FRAMEWORK_REPO_TOKEN }}
          repository: mcxiaochen/Dusklight
          event-type: content-updated
          client-payload: '{"ref": "${{ github.ref }}", "sha": "${{ github.sha }}"}'
```

### 0.7 框架仓库部署工作流更新

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  repository_dispatch:
    types: [content-updated]  # 接收内容仓库的触发
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # 同步内容仓库
      - name: Sync content
        run: pnpm sync-content
        env:
          ENABLE_CONTENT_SYNC: "true"
          CONTENT_REPO_URL: ${{ secrets.CONTENT_REPO_URL }}
          CONTENT_BRANCH: main

      - name: Build Astro site
        run: pnpm build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 0.8 内容集合配置（适配 symlink）

```typescript
// src/content.config.ts
// 注意：由于使用 symlink，路径仍然指向 src/content/
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content",  // symlink 指向 content/blog
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    abbrlink: z.string().optional(),
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    comment: z.boolean().default(true),
    toc: z.boolean().default(true),
  }),
});

export const collections = { blog };
```

### 0.9 本地开发流程

```bash
# 首次设置
git clone https://github.com/mcxiaochen/Dusklight.git
cd Dusklight
pnpm install

# 配置内容仓库
cp .env.example .env
# 编辑 .env，填入 CONTENT_REPO_URL

# 同步内容（自动执行，也可手动）
pnpm sync-content

# 启动开发服务器（会自动同步内容）
pnpm dev

# 创建新文章（在内容仓库中）
# 直接在 content/blog/ 下创建目录和 index.md
```

---

## 🎨 Phase 1: 基础架构与配置系统

### 1.1 配置文件系统

**目标**: 所有可配置项从代码中提取到独立配置文件

#### `src/config/site.ts` - 站点配置
```typescript
export const siteConfig = {
  title: "Dusklight Blog",
  subtitle: "mcxiaochen 的个人博客",
  description: "分享技术、生活与思考",
  site: "https://blog.mcxiaochen.top",
  lang: "zh-CN",
  author: "mcxiaochen",

  // 功能开关
  features: {
    comments: true,
    search: true,
    analytics: false,
    rss: true,
  },
};
```

#### `src/config/cdn.ts` - CDN 配置（中国大陆优先）
```typescript
export const cdnConfig = {
  // 主 CDN（优先使用 jsdelivr）
  primary: "https://cdn.jsdelivr.net",

  // 备用 CDN
  fallback: "https://cdnjs.cloudflare.com",

  // 具体资源地址
  resources: {
    twikoo: "https://cdn.jsdelivr.net/npm/twikoo@1.6.42/dist/twikoo.all.min.js",
    katex: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
    mermaid: "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js",
  },
};
```

#### `src/config/comment.ts` - 评论配置
```typescript
export const commentConfig = {
  enabled: true,
  twikoo: {
    envId: "https://your-env-id.vercel.app", // Twikoo 环境 ID
    region: "", // 腾讯云区域（可选）
  },
};
```

#### `src/config/theme.ts` - 主题配置
```typescript
export const themeConfig = {
  // 默认主题：light | dark | auto
  defaultTheme: "auto",

  // 液态玻璃效果强度
  glass: {
    blur: 20,           // 模糊半径 (px)
    opacity: 0.72,      // 背景透明度
    borderOpacity: 0.5, // 边框透明度
  },

  // 色彩系统（oklch）
  colors: {
    accentHue: 250,     // 主色调色相 (0-360)
    accentSaturation: 80, // 饱和度 (%)
  },

  // 排版
  typography: {
    contentWidth: 720,  // 内容区最大宽度 (px)
    fontSize: 18,       // 基础字号 (px)
    lineHeight: 1.7,    // 行高
  },
};
```

### 1.2 配置统一导出

#### `src/config/index.ts`
```typescript
export { siteConfig } from "./site";
export { cdnConfig } from "./cdn";
export { commentConfig } from "./comment";
export { themeConfig } from "./theme";
export { navConfig } from "./nav";
export { profileConfig } from "./profile";
export { seoConfig } from "./seo";
```

---

## 🍎 Phase 2: Apple 液态玻璃设计系统

### 2.1 CSS 变量系统

#### `src/styles/global.css` - 核心变量
```css
:root {
  /* ===== 色彩系统 (oklch) ===== */
  --color-accent: oklch(65% 0.25 var(--accent-hue, 250));
  --color-accent-light: oklch(80% 0.15 var(--accent-hue, 250));
  --color-accent-dark: oklch(50% 0.2 var(--accent-hue, 250));

  /* 语义色彩 */
  --color-bg: oklch(99% 0.005 250);
  --color-bg-secondary: oklch(97% 0.01 250);
  --color-bg-tertiary: oklch(95% 0.015 250);
  --color-text: oklch(15% 0.02 250);
  --color-text-secondary: oklch(45% 0.03 250);
  --color-text-tertiary: oklch(65% 0.02 250);
  --color-border: oklch(90% 0.01 250);

  /* ===== 液态玻璃效果 ===== */
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-bg-hover: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-blur: 20px;
  --glass-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.6);

  /* ===== 间距系统 (8pt 网格) ===== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ===== 布局 ===== */
  --content-width: 720px;
  --sidebar-width: 280px;
  --header-height: 64px;
  --border-radius: 16px;
  --border-radius-sm: 8px;
  --border-radius-lg: 24px;

  /* ===== 安全区域 ===== */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);

  /* ===== 过渡动画 ===== */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* ===== 暗色模式 ===== */
:root.dark {
  --color-bg: oklch(15% 0.02 250);
  --color-bg-secondary: oklch(18% 0.025 250);
  --color-bg-tertiary: oklch(22% 0.03 250);
  --color-text: oklch(95% 0.01 250);
  --color-text-secondary: oklch(75% 0.02 250);
  --color-text-tertiary: oklch(55% 0.02 250);
  --color-border: oklch(30% 0.02 250);

  --glass-bg: rgba(30, 30, 32, 0.72);
  --glass-bg-hover: rgba(30, 30, 32, 0.85);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
  --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
```

### 2.2 液态玻璃效果

#### `src/styles/glass.css`
```css
/* ===== 基础玻璃效果 ===== */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-highlight);
  border-radius: var(--border-radius);
}

/* ===== 折射效果（边缘光） ===== */
.glass--refractive {
  position: relative;
  overflow: hidden;
}

.glass--refractive::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 40%,
    transparent 60%,
    rgba(255, 255, 255, 0.05) 100%
  );
  pointer-events: none;
  border-radius: inherit;
}

/* ===== 高光效果 ===== */
.glass--specular::after {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  pointer-events: none;
}

/* ===== 交互式玻璃（悬停态） ===== */
.glass--interactive {
  transition:
    background var(--transition-normal),
    box-shadow var(--transition-normal),
    transform var(--transition-normal);
  cursor: pointer;
}

.glass--interactive:hover {
  background: var(--glass-bg-hover);
  box-shadow:
    var(--glass-shadow),
    var(--glass-highlight),
    0 12px 40px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* ===== 提升层级（模态框、弹出层） ===== */
.glass--elevated {
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-blur: 40px;
  --glass-shadow:
    0 24px 80px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.08);
}

:root.dark .glass--elevated {
  --glass-bg: rgba(30, 30, 32, 0.85);
}

/* ===== 浏览器兼容性回退 ===== */
@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background: rgba(255, 255, 255, 0.95);
  }

  :root.dark .glass {
    background: rgba(30, 30, 32, 0.95);
  }
}

/* ===== 减少动画偏好 ===== */
@media (prefers-reduced-motion: reduce) {
  .glass--interactive {
    transition: none;
  }

  .glass--interactive:hover {
    transform: none;
  }
}
```

### 2.3 排版系统

#### `src/styles/typography.css`
```css
/* Apple HIG 排版比例 */
.text-large-title {
  font-size: 2.125rem;   /* 34px */
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.text-title1 {
  font-size: 1.75rem;    /* 28px */
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.018em;
}

.text-title2 {
  font-size: 1.375rem;   /* 22px */
  font-weight: 700;
  line-height: 1.27;
  letter-spacing: -0.01em;
}

.text-title3 {
  font-size: 1.25rem;    /* 20px */
  font-weight: 600;
  line-height: 1.25;
}

.text-headline {
  font-size: 1.0625rem;  /* 17px */
  font-weight: 600;
  line-height: 1.29;
}

.text-body {
  font-size: 1.0625rem;  /* 17px */
  font-weight: 400;
  line-height: 1.29;
}

.text-callout {
  font-size: 1rem;       /* 16px */
  font-weight: 400;
  line-height: 1.31;
}

.text-subhead {
  font-size: 0.9375rem;  /* 15px */
  font-weight: 400;
  line-height: 1.33;
}

.text-footnote {
  font-size: 0.8125rem;  /* 13px */
  font-weight: 400;
  line-height: 1.38;
}

.text-caption {
  font-size: 0.75rem;    /* 12px */
  font-weight: 400;
  line-height: 1.33;
}
```

### 2.4 响应式布局

```css
/* ===== 基础布局 ===== */
.layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.layout__content {
  flex: 1;
  width: var(--content-width);
  max-width: calc(100% - var(--space-4) * 2);
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  padding-left: calc(var(--space-4) + var(--safe-left));
  padding-right: calc(var(--space-4) + var(--safe-right));
}

/* ===== 响应式断点 ===== */
/* iPhone (紧凑宽度) */
@media (max-width: 428px) {
  :root {
    --content-width: 100%;
    --header-height: 56px;
    --border-radius: 12px;
  }

  body {
    font-size: 16px; /* 防止 iOS 缩放 */
  }

  .layout__content {
    padding: var(--space-4);
  }
}

/* 大手机、小平板 */
@media (min-width: 429px) and (max-width: 768px) {
  :root {
    --content-width: 100%;
  }

  .layout__content {
    padding: var(--space-6) var(--space-4);
  }
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
  :root {
    --content-width: 680px;
  }
}

/* 桌面端 */
@media (min-width: 1025px) {
  :root {
    --content-width: 720px;
  }
}

/* 宽屏（带侧边栏） */
@media (min-width: 1200px) {
  .layout--with-sidebar {
    display: grid;
    grid-template-columns: var(--content-width) var(--sidebar-width);
    gap: var(--space-8);
    max-width: calc(var(--content-width) + var(--sidebar-width) + var(--space-8));
    margin: 0 auto;
  }
}
```

---

## ⚡ Phase 3: Astro 核心配置

### 3.1 `astro.config.mjs` 完整配置

```javascript
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Markdown 插件
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import { transformerNotationHighlight } from "@shikijs/transformers";

// 导入配置
import { siteConfig } from "./src/config/site";
import { cdnConfig } from "./src/config/cdn";

export default defineConfig({
  // 站点信息
  site: siteConfig.site,

  // 集成
  integrations: [
    mdx(),
    sitemap(),
  ],

  // Markdown 配置
  markdown: {
    // Shiki 语法高亮
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      transformers: [
        transformerNotationHighlight(),
      ],
    },

    // Remark 插件（Markdown 扩展）
    remarkPlugins: [
      remarkMath, // 数学公式：$...$ 和 $$...$$
    ],

    // Rehype 插件（HTML 处理）
    rehypePlugins: [
      rehypeKatex, // KaTeX 渲染
      rehypeSlug, // 标题添加 id
      [rehypeAutolinkHeadings, { behavior: "wrap" }], // 标题链接
      [rehypeExternalLinks, {
        target: "_blank",
        rel: ["noopener", "noreferrer"]
      }], // 外部链接新窗口打开
      [rehypeMermaid, { strategy: "img-svg" }], // Mermaid 图表
    ],
  },

  // 图片优化
  image: {
    experimentalLayout: "responsive",
  },

  // 预加载策略
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },

  // Vite 配置
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name].[hash][extname]",
        },
      },
    },
  },
});
```

### 3.2 内容集合配置（内容分离版本）

#### `src/content.config.ts`
```typescript
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  // 🔥 路径指向项目根目录的 content/ 而非 src/content/
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./content/blog",
  }),
  schema: ({ image }) => z.object({
    // 基础信息
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),

    // 分类标签
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),

    // 封面图（相对路径，如 ./cover.jpg）
    cover: z.string().optional(),
    coverAlt: z.string().optional(),

    // 链接
    abbrlink: z.string().optional(),

    // 状态
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),

    // 功能开关
    comment: z.boolean().default(true),
    toc: z.boolean().default(true),
  }),
});

// 独立页面集合（关于、友链等）
const pages = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./content/pages",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { blog, pages };
```

#### 内容目录结构
```
content/
├── blog/
│   ├── hello-world/
│   │   ├── index.md          # 文章正文
│   │   └── cover.jpg         # 封面图（可选）
│   └── astro-guide/
│       ├── index.mdx          # MDX 文章
│       ├── cover.png
│       └── assets/            # 文章内图片
│           ├── diagram.svg
│           └── screenshot.png
├── pages/
│   └── about.md
└── data/
    └── friends.yaml
```

---

## 📦 Phase 4: 组件开发

### 4.1 核心组件

#### `src/components/common/Header.astro`
- 液态玻璃效果导航栏
- 响应式菜单（桌面端水平、移动端汉堡菜单）
- 主题切换按钮
- 粘性定位

#### `src/components/common/Footer.astro`
- 液态玻璃效果底部栏
- 版权信息
- 社交链接
- RSS 订阅入口

#### `src/components/common/ThemeToggle.astro`
- 亮/暗/自动三档切换
- 无闪烁主题恢复（内联脚本）
- View Transitions 兼容

#### `src/components/common/LazyImage.astro`
- Intersection Observer 懒加载
- 渐进式加载（模糊 → 清晰）
- 响应式 srcset
- WebP/AVIF 自动转换

#### `src/components/blog/PostCard.astro`
- 液态玻璃卡片效果
- 非对称布局变体
- 标签展示
- 阅读时间估算

#### `src/components/blog/TOC.astro`
- 目录生成（基于 headings）
- 滚动高亮
- 折叠/展开

#### `src/components/blog/TwikooComments.astro`
- Twikoo 评论集成
- CDN 加载
- View Transitions 重新初始化

#### `src/components/seo/SEOHead.astro`
- 完整 Meta 标签
- Open Graph
- Twitter Cards
- JSON-LD 结构化数据

### 4.2 非对称布局设计

```astro
---
// src/pages/index.astro - 非对称首页布局
---

<div class="home-grid">
  <!-- 左侧：个人资料卡（固定） -->
  <aside class="home-sidebar">
    <ProfileCard />
    <TagCloud />
  </aside>

  <!-- 右侧：内容流 -->
  <main class="home-main">
    <HeroSection />
    <RecentPosts />
  </main>
</div>

<style>
  .home-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--space-8);
    max-width: 1100px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .home-grid {
      grid-template-columns: 1fr;
    }

    .home-sidebar {
      order: 2; /* 移动端侧边栏移到底部 */
    }
  }
</style>
```

---

## 📝 Phase 5: Markdown 扩展

### 5.1 支持的 Markdown 特性

| 特性 | 实现方式 | 示例 |
|------|---------|------|
| 数学公式 | remark-math + rehype-katex | `$E = mc^2$` |
| Mermaid 图表 | rehype-mermaid | ` ```mermaid ... ``` ` |
| 代码高亮 | Shiki (内置) | ` ```js ... ``` ` |
| 代码高亮行 | @shikijs/transformers | `// [!code highlight]` |
| 脚注 | GFM (内置) | `[^1]` |
| 任务列表 | GFM (内置) | `- [x] Done` |
| 自动链接标题 | rehype-autolink-headings | `## 标题` → 可点击 |
| 外部链接 | rehype-external-links | 自动 `target="_blank"` |
| 表格 | GFM (内置) | 标准 Markdown 表格 |

### 5.2 MDX 支持

在 `.mdx` 文件中可以直接导入和使用 Astro 组件：

```mdx
---
title: "使用 MDX 的文章"
---

import MyComponent from "../../components/MyComponent.astro";

# 标题

<MyComponent prop="value" />

普通 Markdown 内容...
```

---

## 💬 Phase 6: 评论系统

### 6.1 Twikoo 集成

```astro
---
// src/components/blog/TwikooComments.astro
import { commentConfig } from "../../config/comment";
import { cdnConfig } from "../../config/cdn";
---

{commentConfig.enabled && (
  <div id="tcomment" class="glass" style="margin-top: var(--space-8); padding: var(--space-6);">
  </div>

  <script define:vars={{
    envId: commentConfig.twikoo.envId,
    cdnUrl: cdnConfig.resources.twikoo
  }}>
    function initTwikoo() {
      if (typeof twikoo !== "undefined") {
        twikoo.init({
          envId: envId,
          el: "#tcomment",
        });
      }
    }

    // 动态加载 Twikoo
    if (!document.querySelector(`script[src="${cdnUrl}"]`)) {
      const script = document.createElement("script");
      script.src = cdnUrl;
      script.onload = initTwikoo;
      document.head.appendChild(script);
    } else {
      initTwikoo();
    }

    // View Transitions 重新初始化
    document.addEventListener("astro:page-load", initTwikoo);
  </script>
)}
```

---

## 🔍 Phase 7: SEO 优化

### 7.1 SEO 组件

```astro
---
// src/components/seo/SEOHead.astro
interface Props {
  title: string;
  description: string;
  image?: string;
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    authors: string[];
    tags: string[];
  };
}

const { title, description, image, article } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<!-- 基础 Meta -->
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />

<!-- Open Graph -->
<meta property="og:type" content={article ? "article" : "website"} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
{image && <meta property="og:image" content={new URL(image, Astro.site)} />}
<meta property="og:locale" content="zh_CN" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
{image && <meta name="twitter:image" content={new URL(image, Astro.site)} />}

<!-- 文章特有 Meta -->
{article && (
  <>
    <meta property="article:published_time" content={article.publishedTime} />
    {article.modifiedTime && (
      <meta property="article:modified_time" content={article.modifiedTime} />
    )}
    {article.tags.map(tag => (
      <meta property="article:tag" content={tag} />
    ))}
  </>
)}
```

### 7.2 JSON-LD 结构化数据

```astro
---
// src/components/seo/JsonLd.astro
interface Props {
  type: "article" | "website";
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
}

const props = Astro.props;

const schema = props.type === "article"
  ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: props.title,
      description: props.description,
      url: props.url,
      image: props.image,
      datePublished: props.datePublished,
      dateModified: props.dateModified || props.datePublished,
      author: {
        "@type": "Person",
        name: props.author,
      },
      publisher: {
        "@type": "Organization",
        name: "Dusklight Blog",
      },
    }
  : {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: props.title,
      description: props.description,
      url: props.url,
    };
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### 7.3 随机 Abbrlink

```typescript
// src/utils/abbrlink.ts
import { createHash } from "crypto";

/**
 * 生成随机 abbrlink
 * 格式：8位16进制字符串
 * 用于 SEO 友好的 URL
 */
export function generateAbbrlink(title: string, date: Date): string {
  const input = `${title}${date.toISOString()}${Math.random()}`;
  return createHash("md5")
    .update(input)
    .digest("hex")
    .slice(0, 8);
}
```

---

## ⚡ Phase 8: 性能优化

### 8.1 懒加载策略

```astro
---
// src/components/common/LazyImage.astro
import { Image } from "astro:assets";
import type { ImageMetadata } from "astro";

interface Props {
  src: ImageMetadata;
  alt: string;
  width?: number;
  height?: number;
  class?: string;
}

const { src, alt, width = 800, height = 450, class: className } = Astro.props;
---

<div class:list={["lazy-image-wrapper", className]}>
  <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    loading="lazy"
    decoding="async"
    format="avif"
    widths={[400, 800, 1200]}
    sizes="(max-width: 800px) 100vw, 800px"
  />
</div>

<style>
  .lazy-image-wrapper {
    overflow: hidden;
    border-radius: var(--border-radius);
    background: var(--color-bg-tertiary);
  }

  .lazy-image-wrapper img {
    transition: opacity 0.3s ease;
  }
</style>
```

### 8.2 预加载配置

```javascript
// astro.config.mjs 中的 prefetch 配置
prefetch: {
  prefetchAll: true,
  defaultStrategy: "hover", // 鼠标悬停时预加载
},
```

### 8.3 代码分割

Astro 默认按页面自动分割代码。对于交互组件使用 Island 架构：

```astro
<!-- 仅在视口可见时加载 -->
<HeavyComponent client:visible />

<!-- 浏览器空闲时加载 -->
<ChatWidget client:idle />

<!-- 仅在特定媒体查询时加载 -->
<MobileNav client:media="(max-width: 768px)" />
```

---

## 🔧 Phase 9: DevOps 配置

### 9.1 GitHub Actions 部署

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Mermaid renderer
        run: npx playwright install --with-deps chromium

      - name: Build Astro site
        run: pnpm build
        env:
          SITE: ${{ vars.SITE_URL }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 9.2 Dependabot 配置

```yaml
# .github/dependabot.yml
version: 2
updates:
  # npm 依赖
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "04:00"
      timezone: "Asia/Shanghai"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "npm"
    commit-message:
      prefix: "chore(deps):"
    groups:
      astro:
        patterns:
          - "astro"
          - "@astrojs/*"
      markdown:
        patterns:
          - "remark-*"
          - "rehype-*"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "github-actions"
    commit-message:
      prefix: "ci(deps):"
```

---

## 📅 实施时间线

### Week 1: 内容分离 + 基础架构
- [ ] **Phase 0**: 内容目录迁移与分离架构
  - 创建 `content/` 目录结构
  - 迁移现有文章到新位置
  - 配置 Astro 内容目录
  - 实现图片动态导入
- [ ] 创建配置文件系统
- [ ] 实现 CSS 变量系统
- [ ] 实现液态玻璃效果

### Week 2: 核心组件
- [ ] Header 组件（玻璃导航栏）
- [ ] Footer 组件
- [ ] ThemeToggle 组件
- [ ] SEOHead 组件
- [ ] PostCover 组件（封面图处理）

### Week 3: 博客功能
- [ ] PostCard 组件
- [ ] 文章详情页布局
- [ ] 目录组件
- [ ] 标签系统
- [ ] 内容验证脚本

### Week 4: 高级功能
- [ ] Twikoo 评论集成
- [ ] Markdown 扩展配置
- [ ] 懒加载优化
- [ ] RSS 生成

### Week 5: 部署优化
- [ ] GitHub Actions 工作流
- [ ] Dependabot 配置
- [ ] SEO 验证
- [ ] 性能测试
- [ ] 内容分离文档

---

## 📚 参考资源

### 设计参考
- [Apple Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)
- [Apple HIG Layout](https://developer.apple.com/cn/design/human-interface-guidelines/layout)
- [张洪Heo 博客](https://blog.zhheo.com/)
- [LiuShen 博客](https://blog.liushen.fun/)

### 模板参考
- [Mizuki](https://github.com/LyraVoid/Mizuki) - 模块化配置、原子设计
- [fuwari](https://github.com/saicaca/fuwari) - 简洁架构、oklch 色彩

### 技术文档
- [Astro 7 文档](https://docs.astro.build/)
- [Twikoo 文档](https://twikoo.js.org/)
- [KaTeX 文档](https://katex.org/)
- [Mermaid 文档](https://mermaid.js.org/)

---

## ✅ 验收标准

1. **设计美学**: 符合 Apple 液态玻璃风格，圆角、模糊、半透明
2. **响应式**: 桌面端和移动端完美适配
3. **暗色模式**: 无闪烁切换，文本高可读性
4. **内容分离**:
   - ✅ 文章内容位于 `content/` 目录，独立于 `src/` 框架代码
   - ✅ 图片通过相对路径引用，跟随文章目录
   - ✅ 支持封面图自动导入
   - ✅ 框架替换时内容可直接迁移
5. **Markdown**: 支持数学公式、Mermaid、代码高亮
6. **评论**: Twikoo 正常工作
7. **性能**: 懒加载、预加载、代码分割
8. **配置**: 所有可配置项外部化
9. **SEO**: 完整 Meta、JSON-LD、Sitemap、RSS、随机 abbrlink
10. **部署**: GitHub Actions 自动构建部署到 gh-pages 分支
