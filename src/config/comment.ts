/**
 * 评论系统配置
 */
export const commentConfig = {
  // 是否启用评论
  enabled: true,

  // PUBLIC_ARTALK_SERVER 仅用于隔离预览，正式构建默认使用 EdgeOne 入口。
  server: import.meta.env.PUBLIC_ARTALK_SERVER || "https://artalk.mcxiaochen.top",
  site: "Dusklight",
  emoticons: "/json/owo.json",
  legacyMap: "/comments/legacy-map.json",
  avatarMap: "/comments/historical-avatars.json",
  gravatar: { mirror: "https://www.gravatar.com/avatar/", params: "sha256=1&d=identicon&s=140" },

  recentComments: {
    enabled: true,
    limit: 5,
  },
} as const;
