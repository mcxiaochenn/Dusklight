/**
 * 站点基础配置
 */
export const siteConfig = {
  // 站点信息
  title: "辰渊尘の博客",
  subtitle: "辰渊尘 的个人博客",
  description: "分享技术、生活与思考",
  site: "https://blog.mcxiaochen.top",
  lang: "zh-CN",
  author: "辰渊尘",

  // 时区
  timezone: "Asia/Shanghai",

  // 项目仓库地址
  repoUrl: "https://github.com/mcxiaochenn/Dusklight",

  // 建站日期 — 侧栏「运行天数」的起点
  siteStartDate: "2025-07-17",

  // pangu 盘古之白（CJK 与西文间自动补空格，构建期渲染管线处理）
  // "off" 关闭 | "global" 全部 markdown（默认） | "posts" 仅文章
  pangu: "global" as "off" | "global" | "posts",

  // 追番页 — scripts/update-anime.mjs 构建期从 Bilibili 拉取（vmid = B 站 UID）
  anime: {
    vmid: "123757127",
  },

  // 背景图（相对 public/ 的路径）
  backgroundImages: {
    light: "/images/bg/xiowo-bg-light.webp",
    dark: "/images/bg/xiowo-bg-dark.webp",
  },

  // ICP 备案
  icp: [
    { label: "萌ICP备20257721号", url: "https://icp.gov.moe/?keyword=20257721" },
    { label: "浙ICP备2026011009号", url: "https://beian.miit.gov.cn/" },
  ],

  // Friend-Circle-Lite API
  fcliteApiUrl: "https://fc.mcxiaochen.top/",

  // check-flink 友链可达性检测结果
  flinkStatusUrl: "https://check-flink.mcxiaochen.top/result.json",

  // Umami 访问统计
  analytics: {
    url: "https://umami.mcxiaochen.top/script.js",
    websiteId: "9b066975-f44d-4b3c-bd7a-7077c58e2bdd",
    apiUrl: "https://rainyun-apiumami.mcxiaochen.top/",
  },

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
    analytics: true,
    rss: true,
  },
} as const;
