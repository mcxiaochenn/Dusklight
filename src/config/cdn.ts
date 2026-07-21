/**
 * CDN 配置
 * 中国大陆优先使用 jsdelivr
 */
export const cdnConfig = {
  // 主 CDN（优先使用 jsdelivr）
  primary: "https://cdn.jsdelivr.net",

  // 备用 CDN
  fallback: "https://cdnjs.cloudflare.com",

  // 具体资源地址
  resources: {
    // Twikoo 评论系统
    twikoo: "https://cdn.jsdelivr.net/npm/twikoo@1.6.42/dist/twikoo.all.min.js",

    // KaTeX 数学公式
    katexCss: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
    katexJs: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js",

    // Mermaid 图表
    mermaid: "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js",
  },
} as const;
