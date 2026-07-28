import { definePlugin } from "@expressive-code/core";

export function pluginLanguageBadge() {
	return definePlugin({
		name: "Language Badge",
		hooks: {
			postprocessRenderedBlock: ({ codeBlock, renderData }) => {
				const language = codeBlock.language;
				if (language && renderData.blockAst.properties) {
					renderData.blockAst.properties["data-language"] = language;
				}
			},
		},
		baseStyles: () => `
      .frame[data-language]:not(.has-title):not(.is-terminal) {
        position: relative;

        &::after {
          position: absolute;
          z-index: 2;
          right: 0.5rem;
          top: 0.5rem;
          padding: 0.1rem 0.5rem;
          content: attr(data-language);
          font-family: var(
            --ec-codeFontFml,
            "JetBrains Mono Variable",
            "JetBrains Mono",
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace
          );
          font-size: 0.75rem;
          font-weight: bold;
          text-transform: uppercase;
          /* 必须用本项目 tokens.css 里真实存在的变量。原值 --btn-content /
             --btn-regular-bg 是 Mizuki 主题的命名，本项目没有 --btn-* 这一族，
             又没写 fallback —— 两条声明在计算值阶段直接失效（invalid at
             computed-value time）：background 回落 initial 变全透明，color 作为
             继承属性回落到 .frame 的正文色。结果是徽章以「与代码正文同色、无底色」
             的形式压在代码右上角。实测 61 处代码块全中。 */
          color: var(--foreground-secondary);
          background: var(--surface-2);
          border-radius: var(--radius-md);
          pointer-events: none;
          transition: opacity 0.3s;
          opacity: 0;
        }

        @media (hover: hover) {
          &::after {
            opacity: 1;
          }
          &:hover::after {
            opacity: 0;
          }
        }
      }
    `,
	});
}
