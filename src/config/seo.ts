/**
 * SEO 配置
 */
export const seoConfig = {
  // 默认 Meta 标签
  defaults: {
    title: "Dusklight Blog",
    description: "分享技术、生活与思考 - mcxiaochen 的个人博客",
    image: "/images/og-default.jpg",  // 默认 OG 图片
  },

  // JSON-LD 结构化数据
  jsonLd: {
    organization: {
      name: "Dusklight Blog",
      url: "https://blog.mcxiaochen.top",
      logo: "/images/logo.png",
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
