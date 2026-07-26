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

  // 建站日期 — 侧栏「运行天数」的起点
  siteStartDate: "2025-07-17",

  // pangu 盘古之白（CJK 与西文间自动补空格，构建期渲染管线处理）
  // "off" 关闭 | "global" 全部 markdown（默认） | "posts" 仅文章
  pangu: "global" as "off" | "global" | "posts",

  // 分页
  postsPerPage: 8,

  // 防镜像站 — 检测到非官方域名时重定向到提醒页
  antiMirror: {
    enabled: true,
  },

  // 功能开关
  features: {
    comments: true,
    search: true,
    analytics: false,
    rss: true,
  },
} as const;
