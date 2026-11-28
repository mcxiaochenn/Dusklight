# 待办事项 (TODO)

## 下轮优先修复

- [ ] **统一全局圆角曲线（修复友链页延时标签及全站细节圆角不匹配）**
  - 目前切换至苹果超大几何 R 角体系（`10px / 14px / 22px / 28px`）后，友链页（`src/pages/link.astro`）卡片右下角延迟状态标签（`.friend-card__status`，当前使用 `--radius-sm: 10px` 且紧贴 `var(--radius-lg): 22px` 外卡右下角）出现内外 R 角曲率不协调的问题。
  - 需系统排查 `link.astro`、文章页标签/元信息徽章、侧边栏内部芯片、Twikoo 按钮/输入框、追番/设备/技能/关于页子控件的圆角数值与嵌套曲率关系（同心圆角公式：`外层圆角 - 内边距 = 内层圆角`），统一全站控件圆角比例。

- [ ] **修复 Twikoo 评论区人机验证弹窗层级问题**
  - 目前点击发送评论时弹出的 Twikoo 人机验证控件（Cap / Captcha 浮层）会置于评论区或页面容器下方，导致无法正常点击完成验证。
  - 根因方向排查：`backdrop-filter`、`overflow: hidden` 以及 `.page-surface` / `.article` / `#comments` 等容器建立的独立层叠上下文（Stacking Context）会截断内部 `position: fixed` / 高 `z-index` 弹窗的层级；需检查 Twikoo 验证弹窗 DOM 挂载位置与 `z-index` / `overflow` / `isolation` 层级约束，确保验证弹窗始终置于全站最顶层。
