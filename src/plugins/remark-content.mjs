import getReadingTime from "reading-time";
import { visit } from "unist-util-visit";

export function remarkContent() {
	return (tree, { data }) => {
		if (!data.astro) {
			data.astro = {};
		}
		if (!data.astro.frontmatter) {
			data.astro.frontmatter = {};
		}

		let fullText = "";
		let excerpt = "";

		const moreTagRegex = /<!--\s*more\s*-->/i;
		let moreTagIndex = -1;

		if (tree.children && Array.isArray(tree.children)) {
			moreTagIndex = tree.children.findIndex(
				(node) =>
					node.type === "html" && node.value && moreTagRegex.test(node.value),
			);
		}

		if (moreTagIndex !== -1) {
			const excerptNodes = tree.children.slice(0, moreTagIndex);
			excerpt = excerptNodes.map(getNodeText).join("");
		} else {
			if (tree.children && Array.isArray(tree.children)) {
				for (const node of tree.children) {
					if (node.type === "paragraph") {
						const text = getNodeText(node);
						if (text && text.trim().length > 0) {
							excerpt = text;
							break;
						}
					}
				}
			}
		}

		visit(tree, (node) => {
			if (node.type === "code" || node.type === "inlineCode") {
				return "skip";
			}
			if (node.type === "text" && node.value) {
				fullText += `${node.value} `;
			}
		});

		const cjkPattern =
			/[一-龥぀-ゟ゠-ヿ가-힯　-〿＀-￯]/g;

		const cjkMatches = fullText.match(cjkPattern);
		const cjkCount = cjkMatches ? cjkMatches.length : 0;

		const nonCjkText = fullText.replace(cjkPattern, " ");
		const nonCjkStats = getReadingTime(nonCjkText);

		const totalWords = nonCjkStats.words + cjkCount;
		const minutes = nonCjkStats.words / 200 + cjkCount / 400;

		data.astro.frontmatter.excerpt = excerpt;
		data.astro.frontmatter.minutes = Math.max(1, Math.round(minutes));
		data.astro.frontmatter.words = totalWords;
	};
}

function getNodeText(node) {
	if (!node) {
		return "";
	}
	if (node.type === "text") {
		return node.value || "";
	}
	if (node.type === "image") {
		return node.alt || "";
	}
	if (
		node.type === "code" ||
		node.type === "inlineCode" ||
		node.type === "html"
	) {
		return "";
	}
	if (node.children && Array.isArray(node.children)) {
		return node.children.map(getNodeText).join("");
	}
	return "";
}
