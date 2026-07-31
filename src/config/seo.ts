import { siteConfig } from "./site";

/**
 * SEO 配置 — 仅保留 site.ts 无法派生的字段
 * 站点标题、描述、URL 等统一从 siteConfig 读取
 */
export const seoConfig = {
  // 默认 OG 图片。必须指向 public/ 下真实存在的文件
  defaults: {
    image: "/favicon/favicon.png",
  },

  // JSON-LD 中 logo 需要单独配置（site.ts 无此字段）
  jsonLd: {
    organization: {
      logo: "/favicon/favicon.png",
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
    sitemap: `${siteConfig.site}/sitemap-index.xml`,
  },
} as const;
