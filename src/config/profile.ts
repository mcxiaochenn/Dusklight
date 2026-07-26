/**
 * 个人信息配置 — 所有文案集中在此
 */
export const profileConfig = {
  // ─── 基本信息 ───
  name: "辰渊尘",
  avatar: "/images/congyu/touxiang.webp",
  bio: "有志不在年高，无志空活百岁。",
  location: "浙江·嘉兴",
  email: "mcxiaochenn_yyds@163.com",

  // ─── MBTI ───
  mbti: "INTP-T",
  mbtiDesc: "大众前社恐，实则慢热，和熟人比较放得开 :(",

  // ─── 身份标签（About 页 Hero 区 chips） ───
  identities: ["高中生", "半吊子开发者", "二次元"],

  // ─── 喜欢的番 / 游戏（About 页卡片，文案与生产 about.md 逐字一致） ───
  favorites: {
    anime: ["孤独摇滚", "国家队", "晨曦公主", "EVA（新世纪福音战士）", "鬼灭之刃"],
    games: ["各种旮旯给木（GalGame）", "Minecraft", "CS", "明日方舟：终末地", "鸣潮"],
  },

  // ─── 社交链接（icon 为 astro-icon 名称） ───
  socials: [
    { label: "GitHub", url: "https://github.com/mcxiaochenn", icon: "simple-icons:github" },
    { label: "Bilibili", url: "https://space.bilibili.com/123757127", icon: "simple-icons:bilibili" },
    { label: "QQ", url: "https://qm.qq.com/q/KZKEcWKVSq", icon: "simple-icons:qq" },
    { label: "Telegram", url: "https://t.me/mcxiaochenn", icon: "simple-icons:telegram" },
    { label: "酷安", url: "https://www.coolapk.com/u/21508887", icon: "ph:link" },
    { label: "Email", url: "mailto:mcxiaochenn_yyds@163.com", icon: "ph:envelope" },
  ] as ReadonlyArray<{ label: string; url: string; icon: string }>,

  // ─── 个人简介（Hero 区短文） ───
  intro: "一个热爱技术与生活的开发者，喜欢折腾新工具，用代码解决问题。博客记录学习笔记、项目心得与日常思考。",

  // ─── 技能标签 ───
  skills: ["TypeScript", "React", "Vue", "Astro", "Node.js", "Docker"],

  // ─── 详细介绍（config 内的后备内容，about.md 存在时优先用 md） ───
  sections: [
    {
      title: "关于我",
      content:
        "你好，我是 mcxiaochen，一名前端开发者。热爱开源与技术分享，喜欢通过博客记录自己的学习和成长。",
    },
    {
      title: "博客",
      content:
        "本博客使用 Astro 构建，采用自研 Dusklight 主题。追求简洁、优雅、高性能的阅读体验。",
    },
  ] as ReadonlyArray<{ title: string; content: string }>,
} as const;
