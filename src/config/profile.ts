/**
 * 个人信息配置
 */
export const profileConfig = {
  // 基本信息
  name: "mcxiaochen",
  avatar: "/images/avatar.jpg",  // 头像路径
  bio: "热爱技术，热爱生活",

  // 详细介绍（支持 Markdown）
  description: `
    👋 你好，我是 mcxiaochen
    🌱 热爱编程、开源、技术分享
    💬 欢迎交流与讨论
  `,

  // 技能标签
  skills: ["TypeScript", "React", "Vue", "Astro", "Node.js"],
} as const;
