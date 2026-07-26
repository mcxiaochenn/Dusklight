/**
 * 导航配置 — 支持二级菜单
 */
export interface NavItem {
  label: string;
  href: string;
  /** 外部链接：新标签页打开 */
  external?: boolean;
  children?: NavItem[];
}

export const navConfig = {
  // 主导航 — 结构对齐生产站（blog.mcxiaochen.top）
  main: [
    { label: "首页", href: "/" },
    { label: "归档", href: "/archive/" },
    { label: "留言板", href: "/envelope/" },
    { label: "友链", href: "/link/" },
    {
      label: "关于",
      href: "/about/",
      children: [
        { label: "我的追番", href: "/anime/" },
        { label: "设备", href: "/devices/" },
        { label: "技术栈", href: "/skills/" },
        { label: "Timeline", href: "/timeline/" },
        { label: "赞助", href: "/sponsors/" },
        { label: "关于本站", href: "/about/" },
      ],
    },
    {
      label: "外链",
      href: "#",
      children: [
        { label: "开往", href: "https://www.travellings.cn/go.html", external: true },
        { label: "Umami", href: "https://umami.mcxiaochen.top/share/JQO3UR9vAhjfqs96", external: true },
        { label: "AI 提示词生成器", href: "https://t2iprompt.mcxiaochen.top/", external: true },
      ],
    },
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
