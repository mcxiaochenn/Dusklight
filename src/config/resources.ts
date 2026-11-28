/**
 * 运行时 JS/CSS 资源的唯一配置入口。
 * npm/Vite import、API 和普通图片不属于此类资源。
 */
export const resourceConfig = {
  scripts: {
    umami: "https://umami.mcxiaochen.top/script.js",
    mermaid: "/vendor/mermaid.min.js",
    twikoo: "/vendor/twikoo.all.nocss.js",
    friendCircleLite: "/vendor/fclite.min.js",
    pagefind: "/pagefind/pagefind.js",
  },
  styles: {
    friendCircleLite: "/vendor/fclite.min.css",
    // 中文网字计划（https://chinese-font.netlify.app/zh-cn/）官方 CDN
    chillRoundRegular: "https://cn-font.claude-code-best.win/packages/hcqyt/dist/ChillRoundFRegular/result.css",
    chillRoundBold: "https://cn-font.claude-code-best.win/packages/hcqyt/dist/ChillRoundFBold/result.css",
    mapleMonoRegular: "https://cn-font.claude-code-best.win/packages/maple-mono-cn/dist/MapleMono-CN-Regular/result.css",
    mapleMonoBold: "https://cn-font.claude-code-best.win/packages/maple-mono-cn/dist/MapleMono-CN-Bold/result.css",
  },
} as const;
