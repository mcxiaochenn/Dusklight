/**
 * 评论系统配置
 */
export const commentConfig = {
  // 是否启用评论
  enabled: true,

  twikoo: {
    // PUBLIC_TWIKOO_ENV_ID 仅用于隔离预览，正式构建默认使用生产入口。
    envId: import.meta.env.PUBLIC_TWIKOO_ENV_ID || "https://twikoo.mcxiaochen.top/",
    region: "",
  },

  defaultAvatar: "/images/avatar-fallback.svg",

  recentComments: {
    enabled: true,
    limit: 5,
    includeReply: true,
  },
} as const;
