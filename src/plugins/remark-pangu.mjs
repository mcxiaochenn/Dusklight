import { visit } from "unist-util-visit";
import pangu from "pangu";

/**
 * 本插件排在 remarkDirective 之前（顺序见 astro.config.mjs：pangu 第 2 位、
 * remarkDirective 第 5 位），此时 `:::note[标题]` / `:spoiler[内容]` 还是普通
 * text 节点。pangu 会在指令名与紧随的 `[` / `{` 之间补一个空格，把指令头打断：
 *   :::note[注意事项]  →  :::note [注意事项]     指令解析失败，按字面量渲染
 *   :spoiler[剧透]     →  :spoiler [剧透]
 * 这里把这一个空格还原。现网内容暂未踩到，只因唯一一处 :spoiler 的内容以 `~~`
 * 开头，GFM 删除线先把文本节点切开、指令头单独成节点不含 CJK —— 属侥幸而非设计。
 *
 * 之所以不改成"把 pangu 挪到 remarkDirective 之后"：remarkContent（摘录与
 * 字数统计）在第 3 位，挪过去会让摘录/字数退回未补空格的文本。
 */
function repairDirectiveHeads(value) {
	return value.replace(/(^|\s)(:{1,3}[a-zA-Z][a-zA-Z0-9_-]*) (?=[[{])/g, "$1$2");
}

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
			node.value = repairDirectiveHeads(pangu.spacingText(node.value));
		});
	};
}
