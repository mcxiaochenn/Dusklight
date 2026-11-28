/**
 * 主题配置
 * ⚠️ DEPRECATED — 此文件不被任何组件消费，真实值在 src/styles/tokens.css。
 *    实际 token 为 --hue: 170，--glass-blur: 8px，--glass-saturation: 180%。
 */
export const themeConfig = {
  // 默认主题：light | dark | auto
  defaultTheme: "auto" as "light" | "dark" | "auto",

  // 液态玻璃效果（Mo 的记事簿高饱和磨砂方案）
  glass: {
    blur: 8,            // 基础模糊半径 (px)
    opacity: 0.6,       // 深色模式背景不透明度 (#1e1e1e99)
    borderOpacity: 0.35,// 浅色边框透明度（深色为 #42444a 实线切边）
  },

  // 色彩系统（oklch）
  colors: {
    accentHue: 170,       // 主色调色相 (0-360)
    accentSaturation: 80, // 饱和度 (%)
  },

  // 排版
  typography: {
    contentWidth: 720,  // 内容区最大宽度 (px)
    fontSize: 18,       // 基础字号 (px)
    lineHeight: 1.7,    // 行高
  },
} as const;
