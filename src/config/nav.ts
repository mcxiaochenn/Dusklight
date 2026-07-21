/**
 * 导航配置
 */
export const navConfig = {
  // 主导航
  main: [
    { label: "首页", href: "/" },
    { label: "博客", href: "/blog" },
    { label: "归档", href: "/archive" },
    { label: "关于", href: "/about" },
  ],

  // 社交链接
  social: [
    {
      label: "GitHub",
      href: "https://github.com/mcxiaochen",
      icon: "github",
    },
    {
      label: "RSS",
      href: "/rss.xml",
      icon: "rss",
    },
  ],
} as const;
