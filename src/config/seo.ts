/**
 * SEO 配置
 */
export const seoConfig = {
  // 默认 Meta 标签
  defaults: {
    title: "Dusklight Blog",
    description: "分享技术、生活与思考 - mcxiaochen 的个人博客",
    // 默认 OG 图片。必须指向 public/ 下真实存在的文件 —— 原值
    // /images/og-default.jpg 并不存在，导致所有无 cover 的页面
    // og:image / twitter:image 恒 404，分享卡片没有预览图。
    // 建议后续换成专门的 1200×630 分享图（放进 public/images/ 即可）。
    image: "/favicon/favicon.png",
  },

  // JSON-LD 结构化数据
  jsonLd: {
    organization: {
      name: "Dusklight Blog",
      url: "https://blog.mcxiaochen.top",
      // 同上：/images/logo.png 不存在，JSON-LD 的 publisher.logo 抓取 404
      logo: "/favicon/favicon.png",
    },
    person: {
      name: "mcxiaochen",
      url: "https://blog.mcxiaochen.top",
    },
  },

  // 搜索引擎验证
  verification: {
    google: "",      // Google Search Console 验证码
    bing: "",        // Bing Webmaster 验证码
    baidu: "",       // 百度站长平台验证码
  },

  // robots.txt 配置
  robots: {
    allow: ["/"],
    disallow: ["/api/", "/admin/"],
    sitemap: "https://blog.mcxiaochen.top/sitemap-index.xml",
  },
} as const;
