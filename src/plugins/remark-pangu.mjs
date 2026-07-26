import { visit } from "unist-util-visit";
import pangu from "pangu";

/**
 * remark-pangu — 构建期为 CJK 与西文/数字之间补空格（盘古之白）。
 *
 * 在 mdast 文本节点上调用 pangu.spacingText，属于渲染管线内的
 * 源头变换 —— 不是前端 JS 注入，无运行时成本、无样式优先级问题。
 * code / inlineCode / math 在 mdast 中是独立的 value 节点类型，
 * visit(tree, "text") 天然不会触及，代码内容零污染。
 *
 * 局限（与浏览器版 pangu.js 一致）：跨节点边界（如 **加粗中文** 紧邻
 * 西文）无法补空格，因为两段文本分属不同节点。
 *
 * @param {{ mode?: "off" | "global" | "posts" }} options
 *   off    — 完全关闭
 *   global — 所有 markdown（默认）
 *   posts  — 仅文章（vfile 路径含 /posts/）
 */
export function remarkPangu(options = {}) {
	const mode = options.mode ?? "global";
	return (tree, file) => {
		if (mode === "off") return;
		if (mode === "posts") {
			const p = String(file?.path ?? "").replace(/\\/g, "/");
			if (!p.includes("/posts/")) return;
		}
		visit(tree, "text", (node) => {
			node.value = pangu.spacingText(node.value);
		});
	};
}
