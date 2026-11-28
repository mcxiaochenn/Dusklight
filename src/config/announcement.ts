/**
 * 侧栏公告配置 — Mo 的记事簿同款（多行文案 + 访客位置/距离/时段问候框）
 */
export const announcementConfig = {
  enabled: true,
  title: "公告",
  content: "😉 你好哇，欢迎来到辰渊尘の博客",
  lines: [
    { text: "😉 你好哇，欢迎来到我的博客" },
    { text: "❓ 如有问题欢迎评论区交流！" },
    { text: "😫 页面异常？尝试", kbd: ["Ctrl", "F5"] },
  ],
  welcome: {
    enabled: true,
    authorName: "小尘",
    /** 站长坐标：浙江省嘉兴市 */
    lat: 30.7461,
    lng: 120.7555,
    poem: "东风渐绿西湖柳，雁已还人未南归",
  },
  // 可选跳转链接，null 表示不显示
  link: null as { text: string; url: string } | null,
} as const;
