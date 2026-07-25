import { h } from "hastscript";
import { visit } from "unist-util-visit";

import mermaidRenderScript from "./mermaid-render-script.js?raw";

export function rehypeMermaid() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (
				node.tagName === "div" &&
				node.properties &&
				node.properties.className &&
				node.properties.className.includes("mermaid-container")
			) {
				const mermaidCode = node.properties["data-mermaid-code"] || "";
				const mermaidId = `mermaid-${Math.random().toString(36).slice(-6)}`;

				const mermaidContainer = h(
					"div",
					{
						class: "mermaid",
						id: mermaidId,
						"data-mermaid-code": mermaidCode,
					},
					mermaidCode,
				);

				const renderScript = h(
					"script",
					{
						type: "text/javascript",
					},
					mermaidRenderScript,
				);

				node.tagName = "div";
				node.properties = { class: "mermaid-diagram-container" };
				node.children = [mermaidContainer, renderScript];
			}
		});
	};
}
