/**
 * 评论系统配置
 */
export const commentConfig = {
  // 是否启用评论
  enabled: true,

  // Twikoo 配置
  twikoo: {
    // 环境 ID（Vercel URL 或腾讯云环境 ID）
    envId: "https://your-env-id.vercel.app",

    // 腾讯云区域（使用腾讯云时填写）
    region: "",

    // 是否在文章页显示评论
    showOnPost: true,

    // 是否在独立页面显示评论
    showOnPage: false,
  },
} as const;
