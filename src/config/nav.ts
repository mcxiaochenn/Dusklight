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
        { label: "全部文章", href: "/archive/", icon: "fa7-solid:box-archive" },
        { label: "分类列表", href: "/categories/", icon: "fa7-solid:folder" },
        { label: "标签列表", href: "/tags/", icon: "fa7-solid:tag" },
      ],
    },
    { label: "留言板", href: "/envelope/" },
    {
      label: "友链",
      href: "/link/",
      children: [
        { label: "友链列表", href: "/link/", icon: "fa7-solid:user-group" },
        { label: "友链朋友圈", href: "/Friend-Circle-Lite/", icon: "fa7-regular:newspaper" },
      ],
    },
    {
      label: "关于",
      href: "/about/",
      children: [
        { label: "我的追番", href: "/anime/", icon: "fa7-solid:tv" },
        { label: "设备", href: "/devices/", icon: "fa7-solid:desktop" },
        { label: "更新日志", href: "/timeline/", icon: "fa7-regular:clock" },
        { label: "关于本站", href: "/about/", icon: "fa7-regular:circle-user" },
      ],
    },
    {
      label: "外链",
      href: "#",
      children: [
        { label: "开往", href: "https://www.travellings.cn/go.html", external: true, icon: "fa7-solid:train" },
        { label: "Umami", href: "https://umami.mcxiaochen.top/share/JQO3UR9vAhjfqs96", external: true, icon: "simple-icons:umami" },
        { label: "AI 提示词生成器", href: "https://t2iprompt.mcxiaochen.top/", external: true, icon: "fa7-solid:robot" },
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
