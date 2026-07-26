/**
 * 侧栏公告配置
 */
export const announcementConfig = {
  enabled: true,
  title: "公告",
  content: "博客正在从 Mizuki 迁移到自研 Dusklight 主题，期间部分功能可能异常！",
  // 可选跳转链接，null 表示不显示
  link: { text: "了解更多", url: "/about/" } as { text: string; url: string } | null,
} as const;
