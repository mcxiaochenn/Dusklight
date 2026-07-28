/**
 * 主题配置
 * ⚠️ DEPRECATED — 此文件不被任何组件消费，真实值在 src/styles/tokens.css。
 *    accentHue: 250 ≠ 实际 --hue: 170，glass.blur: 20 ≠ 实际 --glass-blur: 24px。
 */
export const themeConfig = {
  // 默认主题：light | dark | auto
  defaultTheme: "auto" as "light" | "dark" | "auto",

  // 液态玻璃效果
  glass: {
    blur: 20,           // 模糊半径 (px)
    opacity: 0.72,      // 背景透明度
    borderOpacity: 0.5, // 边框透明度
  },

  // 色彩系统（oklch）
  colors: {
    accentHue: 250,       // 主色调色相 (0-360)
    accentSaturation: 80, // 饱和度 (%)
  },

  // 排版
  typography: {
    contentWidth: 720,  // 内容区最大宽度 (px)
    fontSize: 18,       // 基础字号 (px)
    lineHeight: 1.7,    // 行高
  },
} as const;
