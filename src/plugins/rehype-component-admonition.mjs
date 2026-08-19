import { h } from "hastscript";

/**
 * Creates an admonition component.
 *
 * @param {import('hast').Properties} properties - The properties of the component.
 * @param {string} [properties.title] - An optional title.
 * @param {import('hast').ElementContent[]} children - The children elements of the component.
 * @param {('note'|'info'|'tip'|'important'|'caution'|'warning')} type - The admonition type.
 * @returns {import('hast').Element} The created admonition component.
 */
export function AdmonitionComponent(properties, children, type) {
	if (!Array.isArray(children) || children.length === 0) {
		return h(
			"div",
			{ class: "hidden" },
			'Invalid admonition directive. (Admonition directives must be of block type ":::note{name="name"} <content> :::")',
		);
	}

	let label = null;
	if (properties?.["has-directive-label"]) {
		label = children[0];
		children = children.slice(1);
		label.tagName = "div";
	}

	return h("blockquote", { class: `admonition bdm-${type}` }, [
		h("span", { class: "bdm-title" }, label ? label : type.toUpperCase()),
		...children,
	]);
}
