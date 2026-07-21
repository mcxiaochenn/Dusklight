/**
 * 导航配置 — 支持二级菜单
 */
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const navConfig = {
  // 主导航
  main: [
    { label: "首页", href: "/" },
    {
      label: "博客",
      href: "/blog/",
      children: [
        { label: "全部文章", href: "/blog/" },
        { label: "归档", href: "/archive/" },
        { label: "标签", href: "/tags/" },
      ],
    },
    { label: "关于", href: "/about/" },
  ] as NavItem[],

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
