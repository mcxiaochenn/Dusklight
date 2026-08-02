import { siteConfig } from "./site";

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

  // ─── 喜欢的番 / 游戏（About 页图片卡片） ───
  // 番剧封面来自 MyAnimeList CDN（竖版外链，保持热链）；
  // 游戏封面已下载到 public/images/favorites/ 并转 webp（入库）。
  // landscape: true 的横版图用 16:9 横卡，否则用 3:4 竖卡。
  favorites: {
    anime: [
      { name: "孤独摇滚", image: "https://cdn.myanimelist.net/images/anime/1448/127956l.jpg" },
      { name: "国家队", image: "https://cdn.myanimelist.net/images/anime/1614/90408l.jpg" },
      { name: "晨曦公主", image: "https://cdn.myanimelist.net/images/anime/9/64225l.jpg" },
      { name: "EVA（新世纪福音战士）", image: "https://cdn.myanimelist.net/images/anime/1314/108941l.jpg" },
      { name: "鬼灭之刃", image: "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg" },
    ],
    games: [
      { name: "千恋＊万花", image: "/images/favorites/qianlian-huayu.webp" },
      { name: "Minecraft", image: "/images/favorites/minecraft.webp" },
      { name: "CS", image: "/images/favorites/cs.webp", landscape: true },
      { name: "明日方舟：终末地", image: "/images/favorites/arknights-endfield.webp", landscape: true },
      { name: "鸣潮", image: "/images/favorites/wuthering-waves.webp", landscape: true },
    ],
  },

  // ─── 性格立绘（About 页性格板块） — 16Personalities 官方 INTP-T 形象 ───
  personalityImage: "/images/intp.svg",

  // ─── 社交链接（icon 为 astro-icon 名称） ───
  socials: [
    { label: "GitHub", url: "https://github.com/mcxiaochenn", icon: "simple-icons:github" },
    { label: "Bilibili", url: `https://space.bilibili.com/${siteConfig.anime.vmid}`, icon: "simple-icons:bilibili" },
    { label: "QQ", url: "https://qm.qq.com/q/KZKEcWKVSq", icon: "simple-icons:qq" },
    { label: "Telegram", url: "https://t.me/mcxiaochenn", icon: "simple-icons:telegram" },
    { label: "酷安", url: "https://www.coolapk.com/u/21508887", icon: "local:coolapk" },
    { label: "Email", url: "mailto:mcxiaochenn_yyds@163.com", icon: "local:mail" },
  ] as ReadonlyArray<{ label: string; url: string; icon: string }>,

  // ─── 个人简介（Hero 区短文） ───
  intro: "一个热爱技术与生活的开发者，喜欢折腾新工具，用代码解决问题。博客记录学习笔记、项目心得与日常思考。",

  // ─── 技能标签 ───
  skills: ["TypeScript", "React", "Vue", "Astro", "Node.js", "Docker"],

  // ─── 作者框（anheyu 布局）：头像两侧漂浮标签 ───
  authorTagsLeft: ["高中生", "半吊子开发者"],
  authorTagsRight: ["二次元", "阿尘"],

  // ─── 问候卡（anheyu myInfoAndSayHello） ───
  hello: "嗨！欢迎来到我的小站",
  helloName: "辰渊尘",

  // ─── 站点关键词轮播（anheyu aboutsiteTips 遮罩动画） ───
  aboutsiteTips: {
    tips: "关于本站",
    title1: "生活不止眼前的苟且",
    title2: "还有诗和远方",
    words: ["折腾", "热爱", "坚持", "分享", "前行"],
  },

  // ─── 自我信息行（anheyu selfInfo） ───
  selfInfo: [
    { label: "出生年份", value: "2009" },
    { label: "现居", value: "浙江·嘉兴" },
    { label: "身份", value: "高中生" },
  ],

  // ─── 技能卡标题（anheyu skills 区） ───
  skillsTitle: "我的技能",
  skillsTips: "技多不压身",

  // ─── 详细介绍（About 页玻璃卡片板块，替代 spec/about.md 渲染） ───
  // body 为段落文本（换行分段），links 为链接列表（href 可选，无则纯文本）
  aboutCards: [
    {
      title: "关于我",
      icon: "ph:user",
      body:
        "嗨！这里是辰渊尘的博客关于页，我是小尘！欢迎你来到我的站点！\n\n鄙人 2009 年出身于浙江省嘉兴市平湖市，目前在上职业类学校，是位高中生辣，高二辣。\n\n喜欢折腾一些奇奇怪怪的东西，喜欢骑车，喜欢旅行，热爱生活，喜欢捣鼓科技数码，喜欢玩机，还是二次元。\n\n大伙们可以叫我包括但不限于：小尘、阿尘、尘、尘桑 等等等等。\n\n一个半吊子个人开发者：编程都是爱好~",
    },
    {
      title: "当前常用系统",
      icon: "ph:desktop",
      body: "主力系统曾是 Arch Linux，后因笔记本兼容性问题换回 Windows。",
    },
    {
      title: "我的域名",
      icon: "ph:globe-hemisphere-west",
      links: [
        { text: "mcxiaochen.top — 现在在用的", href: "https://mcxiaochen.top" },
        { text: "mcxiaochen.icu — 用了一年，阿里云第二年涨价弃用", href: null },
        { text: "shuiarun.com — 曾经开 MC 服务器的，已寄", href: null },
        { text: "yuanshenqidong.ddns.net — no-ip 备用 IP", href: null },
      ],
    },
    {
      title: "关于本站",
      icon: "ph:info",
      links: [
        { text: "博客日志", href: "/timeline/" },
        { text: "域名：阿里云", href: "https://aliyun.com/" },
        { text: "文件托管于：GitHub", href: "https://github.com/" },
        { text: "部署：EdgeOne", href: "https://edgeone.ai/products/pages" },
        { text: "主题：Dusklight（自研）", href: "https://github.com/mcxiaochenn/Dusklight" },
      ],
    },
  ] as ReadonlyArray<{
    title: string;
    icon: string;
    body?: string;
    links?: ReadonlyArray<{ text: string; href: string | null }>;
  }>,
} as const;
