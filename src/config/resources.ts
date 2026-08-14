/**
 * 运行时 JS/CSS 资源的唯一配置入口。
 * npm/Vite import、API 和普通图片不属于此类资源。
 */
export const resourceConfig = {
  scripts: {
    umami: "https://umami.mcxiaochen.top/script.js",
    twikoo: "/js/twikoo.min.js",
    mermaid: "/vendor/mermaid.min.js",
    friendCircleLite: "/vendor/fclite.min.js",
    pagefind: "/pagefind/pagefind.js",
  },
  styles: {
    friendCircleLite: "/vendor/fclite.min.css",
  },
} as const;
