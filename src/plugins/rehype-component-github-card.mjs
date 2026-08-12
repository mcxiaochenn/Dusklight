import { h } from "hastscript";

/**
 * Creates a GitHub Card component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.repo - The GitHub repository in the format "owner/repo".
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created GitHub Card component.
 */
export function GithubCardComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0) {
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("github" directive must be leaf type "::github{repo="owner/repo"}")',
		]);
	}

	if (!properties.repo?.includes("/")) {
		return h(
			"div",
			{ class: "hidden" },
			'Invalid repository. ("repo" attribute must be in the format "owner/repo")',
		);
	}

	const repo = properties.repo;
	const cardUuid = `GC${Math.random().toString(36).slice(-6)}`;
	const icon = (className, path) =>
		h(
			"svg",
			{
				class: className,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 2,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				ariaHidden: "true",
			},
			path.map((d) => h("path", { d })),
		);
	const stat = (className, id, label, iconPath, fallback) =>
		h("div", { class: className, title: label }, [
			icon("gc-stat-icon", iconPath),
			h("span", { class: "gc-sr-only" }, `${label}：`),
			h(`span#${id}`, { class: "gc-stat-value" }, fallback),
		]);

	const nAvatar = h(`div#${cardUuid}-avatar`, { class: "gc-avatar" });
	const nTitle = h("div", { class: "gc-titlebar" }, [
		h("div", { class: "gc-titlebar-left" }, [
			h("div", { class: "gc-owner" }, [
				nAvatar,
				h("div", { class: "gc-user" }, repo.split("/")[0]),
			]),
			h("div", { class: "gc-divider" }, "/"),
			h("div", { class: "gc-repo" }, repo.split("/")[1]),
		]),
		icon("github-logo", [
			"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18 0 15 2a13.4 13.4 0 0 0-7 0C5-.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.5 6.8 7A4.8 4.8 0 0 0 8 18v4",
			"M8 19c-3 .9-3-1.5-4-2",
		]),
	]);

	const nDescription = h(
		`div#${cardUuid}-description`,
		{ class: "gc-description" },
		"Waiting for api.github.com...",
	);

	const nStars = stat("gc-stars", `${cardUuid}-stars`, "Star 数", [
		"m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2 1.2-6.8-5-4.9 6.9-1z",
	], "—");
	const nForks = stat("gc-forks", `${cardUuid}-forks`, "Fork 数", [
		"M6 3v12",
		"M18 9a3 3 0 0 1-3 3H9a3 3 0 0 0-3 3",
		"M18 3v6",
		"M4 3h4",
		"M16 3h4",
		"M4 21h4",
	], "—");
	const nLicense = stat("gc-license", `${cardUuid}-license`, "许可证", [
		"M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11",
		"M8 7h6",
		"M8 11h4",
		"m17 17 2 2 4-4",
	], "—");
	const nLanguage = h("span", { class: "gc-language", title: "主要语言" }, [
		h("span", { class: "gc-language-dot", ariaHidden: "true" }),
		h("span", { class: "gc-sr-only" }, "主要语言："),
		h(`span#${cardUuid}-language`, { class: "gc-stat-value" }, "—"),
	]);

	const nScript = h(
		`script#${cardUuid}-script`,
		{ type: "text/javascript", defer: true },
		`
		fetch('https://api.github.com/repos/${repo}', { referrerPolicy: "no-referrer" }).then(response => {
			if (!response.ok) throw new Error('GitHub API request failed: ' + response.status);
			return response.json();
		}).then(data => {
        document.getElementById('${cardUuid}-description').innerText = data.description?.replace(/:[a-zA-Z0-9_]+:/g, '') || "Description not set";
        document.getElementById('${cardUuid}-language').innerText = data.language;
        document.getElementById('${cardUuid}-forks').innerText = Intl.NumberFormat('en-us', { notation: "compact", maximumFractionDigits: 1 }).format(data.forks).replaceAll("\\u202f", '');
        document.getElementById('${cardUuid}-stars').innerText = Intl.NumberFormat('en-us', { notation: "compact", maximumFractionDigits: 1 }).format(data.stargazers_count).replaceAll("\\u202f", '');
        const avatarEl = document.getElementById('${cardUuid}-avatar');
        avatarEl.style.backgroundImage = 'url(' + data.owner.avatar_url + ')';
        avatarEl.style.backgroundColor = 'transparent';
        document.getElementById('${cardUuid}-license').innerText = data.license?.spdx_id || "no-license";
        document.getElementById('${cardUuid}-card').classList.remove("fetch-waiting");
        console.log("[GITHUB-CARD] Loaded card for ${repo} | ${cardUuid}.")
      }).catch(err => {
        const c = document.getElementById('${cardUuid}-card');
        c?.classList.add("fetch-error");
        console.warn("[GITHUB-CARD] (Error) Loading card for ${repo} | ${cardUuid}.")
      })
    `,
	);

	return h(
		`a#${cardUuid}-card`,
		{
			class: "card-github fetch-waiting no-styling",
			href: `https://github.com/${repo}`,
			target: "_blank",
			repo,
		},
		[
			nTitle,
			nDescription,
			h("div", { class: "gc-infobar" }, [nStars, nForks, nLicense, nLanguage]),
			nScript,
		],
	);
}
