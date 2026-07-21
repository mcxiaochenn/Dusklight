/**
 * 站点基础配置
 */
export const siteConfig = {
  // 站点信息
  title: "Dusklight Blog",
  subtitle: "mcxiaochen 的个人博客",
  description: "分享技术、生活与思考",
  site: "https://blog.mcxiaochen.top",
  lang: "zh-CN",
  author: "mcxiaochen",

  // 时区
  timezone: "Asia/Shanghai",

  // 功能开关
  features: {
    comments: true,
    search: true,
    analytics: false,
    rss: true,
  },
} as const;
