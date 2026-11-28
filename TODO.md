# 待办事项 (TODO)

## 下轮优先修复

- [ ] **统一全局圆角曲线（修复友链页延时标签及全站细节圆角不匹配）**
  - 目前切换至苹果超大几何 R 角体系（`10px / 14px / 22px / 28px`）后，友链页（`src/pages/link.astro`）卡片右下角延迟状态标签（`.friend-card__status`，当前使用 `--radius-sm: 10px` 且紧贴 `var(--radius-lg): 22px` 外卡右下角）出现内外 R 角曲率不协调的问题。
  - 需系统排查 `link.astro`、文章页标签/元信息徽章、侧边栏内部芯片、Twikoo 按钮/输入框、追番/设备/技能/关于页子控件的圆角数值与嵌套曲率关系（同心圆角公式：`外层圆角 - 内边距 = 内层圆角`），统一全站控件圆角比例。

- [ ] **修复 Twikoo 评论区人机验证弹窗层级问题**
  - 目前点击发送评论时弹出的 Twikoo 人机验证控件（Cap / Captcha 浮层）会置于评论区或页面容器下方，导致无法正常点击完成验证。
  - 根因方向排查：`backdrop-filter`、`overflow: hidden` 以及 `.page-surface` / `.article` / `#comments` 等容器建立的独立层叠上下文（Stacking Context）会截断内部 `position: fixed` / 高 `z-index` 弹窗的层级；需检查 Twikoo 验证弹窗 DOM 挂载位置与 `z-index` / `overflow` / `isolation` 层级约束，确保验证弹窗始终置于全站最顶层。

- [ ] **学习 [Mo 的记事簿 - MortalCat's blog](https://blog.xiowo.net/) 站点的侧边栏滚动时逻辑**
  - 进一步对齐首页与文章阅读页滚动时侧边栏的粘性布局结构（`.sticky_layout` 包裹底部随屏滚动卡片、`top` 偏移与非粘性区隔离），解决目录或底部卡片在向下滚动过程中可能与后续卡片相互穿插遮挡的问题，同时保持文章结束时随侧栏自然滑离不压住页脚。

- [ ] **补全交互动效覆盖面（修复移动端菜单无开合动画并全局排查）**
  - 目前桌面/移动端在 `Header.astro` 使用原生 `<dialog>.showModal()` 打开移动端菜单时，由于 `dialog` 从 `display: none` 切换为打开态且缺少 `@starting-style` / 退场过渡协调，`.mobile-menu__panel` 与 `.mobile-menu__backdrop` 滑出/淡入完全没有过渡动画。
  - 执行时同步全局排查其他交互控件（如搜索框 `SearchDialog.svelte`、打赏弹层、随机友链弹层、调试面板 `#dev-modal`、折叠目录、标签/归档切换、图片灯箱、页脚及各类下拉/抽屉），统一补齐优美一致的入场与退场动效。


