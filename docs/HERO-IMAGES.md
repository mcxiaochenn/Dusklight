# 首页推荐图规范

首页 Hero 使用文章 frontmatter 中的 `bannerCover`，与普通文章卡片的 `cover` 分离。`bannerCover` 只服务于“全站推荐”轮播，不应直接复用带大字、角标或竖向构图的文章封面。

## 文件规格

| 项目 | 要求 |
| --- | --- |
| 分辨率 | 必须为 `2400 × 800` 像素 |
| 宽高比 | `3:1` |
| 格式 | 优先 WebP；不需要透明通道时禁止使用 PNG |
| 文件大小 | 建议不超过 350 KiB，硬上限 500 KiB |
| 色彩空间 | sRGB |
| 文件名 | 小写英文、数字和连字符，例如 `suzhou-jiangnan-cyber.webp` |

上传图床时应保留原始分辨率，关闭平台的自动加水印与二次锐化，并使用 HTTPS 永久链接。

## 构图安全区

- 关键主体必须位于画面中央 50% 区域，以适配移动端居中裁切。
- 左下区域会叠加“全站推荐”和文章标题，需保持较暗、低细节和足够对比度。
- 右下区域会显示轮播圆点和前后按钮，不放置人脸、设备主体或关键信息。
- 图片内不得嵌入文章标题、Logo、水印、二维码、促销角标或依赖阅读的文字。
- 推荐使用深蓝、青绿等低饱和背景，并以少量暖色建立焦点；避免高密度霓虹和大面积纯黑。

## 内容配置

```yaml
featured: true
cover: https://example.com/article-card.webp
bannerCover: https://example.com/article-hero.webp
```

- `featured` 决定文章是否进入 Hero。
- `bannerCover` 只决定 Hero 图片；`cover` 继续用于文章卡片和正文封面。
- 未配置 `bannerCover` 时会回退到 `cover`，但仅作为兼容行为，不应作为正式推荐图方案。

## 验收

发布前至少检查以下视口：

- 桌面：1440px 宽，主体完整且标题清晰。
- 窄桌面/平板：1024px 宽，无按钮遮挡。
- 移动端：390 × 844，中心裁切后仍能识别主题。
- 首张图正常高优先级加载，其余图片保持懒加载。

## 本轮推荐图源文件

以下文件已上传图床；线上 URL 配置在内容仓库对应文章的 `bannerCover` 中。本目录保留压缩前确认过的标准尺寸 WebP，便于后续重新上传或核对。

| 文章 | 文件 |
| --- | --- |
| 苏州游记：一半江南，一半赛博 | `assets/hero-banners/suzhou-jiangnan-cyber.webp` |
| 今天是0721哦，Ciallo～ | `assets/hero-banners/ciallo-0721.webp` |
| 道歉信：关于 713 解锁视频中伪回锁内容的说明与反思 | `assets/hero-banners/apology-reflection.webp` |
| 713 解锁节来辣 | `assets/hero-banners/android-unlock.webp` |
| 免费领取网易云音乐 7 天会员 | `assets/hero-banners/music-membership.webp` |
