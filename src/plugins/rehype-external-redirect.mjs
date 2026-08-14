import { visit } from "unist-util-visit";
import { siteConfig } from "../config/site.ts";

function isExternal(href) {
	try {
		const url = new URL(href);
		return (url.protocol === "http:" || url.protocol === "https:") &&
			url.origin !== new URL(siteConfig.site).origin;
	} catch {
		return false;
	}
}

function redirectUrl(href) {
	const encoded = Buffer.from(href, "utf8").toString("base64url");
	return `/go/?url=${encodeURIComponent(encoded)}`;
}

/** 仅转换 Markdown/MDX 生成的正文链接，不扫描运行时 DOM。 */
export function rehypeExternalRedirect() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "a" || !node.properties) return;
			const href = node.properties.href;
			if (typeof href !== "string" || !isExternal(href)) return;

			node.properties.href = siteConfig.externalRedirect.enabled ? redirectUrl(href) : href;
			node.properties["data-external-link"] = "true";
			node.children ??= [];
			node.children.push({
				type: "element",
				tagName: "span",
				properties: {
					className: ["external-link__icon", "icon-[fa7-solid--arrow-up-right-from-square]"],
					ariaHidden: "true",
					dataPagefindIgnore: true,
				},
				children: [],
			});
		});
	};
}
