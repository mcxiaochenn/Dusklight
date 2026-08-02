/**
 * 导航配置 — 支持二级菜单
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  /** 外部链接：新标签页打开 */
  external?: boolean;
  children?: NavItem[];
}

export const navConfig = {
  // 主导航 — 结构对齐生产站（blog.mcxiaochen.top）
  main: [
    { label: "首页", href: "/" },
    {
      label: "文库",
      href: "/archive/",
      children: [
        { label: "全部文章", href: "/archive/", icon: "ph:archive" },
        { label: "分类列表", href: "/categories/", icon: "ph:folder" },
        { label: "标签列表", href: "/tags/", icon: "ph:tag" },
      ],
    },
    { label: "留言板", href: "/envelope/" },
    {
      label: "友链",
      href: "/link/",
      children: [
        { label: "友链列表", href: "/link/", icon: "ph:users-three" },
        { label: "友链朋友圈", href: "/Friend-Circle-Lite/", icon: "ph:newspaper" },
      ],
    },
    {
      label: "关于",
      href: "/about/",
      children: [
        { label: "我的追番", href: "/anime/", icon: "ph:television-simple" },
        { label: "设备", href: "/devices/", icon: "ph:monitor" },
        { label: "更新日志", href: "/timeline/", icon: "ph:clock" },
        { label: "关于本站", href: "/about/", icon: "ph:user-circle" },
      ],
    },
    {
      label: "外链",
      href: "#",
      children: [
        { label: "开往", href: "https://www.travellings.cn/go.html", external: true, icon: "ph:train" },
        { label: "Umami", href: "https://umami.mcxiaochen.top/share/JQO3UR9vAhjfqs96", external: true, icon: "ph:chart-bar" },
        { label: "AI 提示词生成器", href: "https://t2iprompt.mcxiaochen.top/", external: true, icon: "ph:robot" },
      ],
    },
  ] as NavItem[],

  // 社交链接
  social: [
    {
      label: "GitHub",
      href: "https://github.com/mcxiaochenn",
      icon: "github",
    },
    {
      label: "RSS",
      href: "/rss.xml",
      icon: "rss",
    },
  ],
} as const;
