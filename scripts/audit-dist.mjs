import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, extname, relative, sep } from "node:path";

const root = resolve(process.argv[2] || "dist");
const siteOrigin = "https://blog.mcxiaochen.top";
const errors = [];

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});
}

function localTarget(pathname) {
	const decoded = decodeURIComponent(pathname);
	const target = resolve(root, `.${decoded}`);
	const candidates = decoded.endsWith("/")
		? [resolve(target, "index.html")]
		: extname(decoded)
			? [target]
			: [target, resolve(target, "index.html")];
	return candidates.some(existsSync);
}

function inspectUrl(rawValue, file, attribute) {
	const value = rawValue.trim();
	if (!value || /^(?:javascript:|undefined|null)/i.test(value)) {
		errors.push(`${file}: 无效 ${attribute}=${JSON.stringify(rawValue)}`);
		return;
	}
	if (/^(?:#|mailto:|tel:|data:)/i.test(value)) return;

	let url;
	try {
		url = new URL(value, `${siteOrigin}/${relative(root, dirname(file)).split(sep).join("/")}/`);
	} catch {
		errors.push(`${file}: 无法解析 ${attribute}=${JSON.stringify(value)}`);
		return;
	}
	if (url.origin !== siteOrigin || localTarget(url.pathname)) return;
	errors.push(`${file}: 不存在的本地目标 ${url.pathname}`);
}

if (!existsSync(root) || !statSync(root).isDirectory()) {
	throw new Error(`未找到静态产物目录：${root}`);
}

for (const file of walk(root).filter((path) => path.endsWith(".html"))) {
	// 动态脚本里的 HTML 字符串不属于构建后的静态 DOM，不能按标签属性审计。
	const html = readFileSync(file, "utf8").replace(/<script\b[\s\S]*?<\/script>/gi, "");
	for (const match of html.matchAll(/<(?:a|area|link)\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) inspectUrl(match[2], file, "href");
	for (const match of html.matchAll(/<(?:script|img|source)\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi)) inspectUrl(match[2], file, "src");
}

if (errors.length) {
	console.error(`静态产物审计失败（${errors.length} 项）：\n${errors.join("\n")}`);
	process.exit(1);
}

console.log("静态产物审计通过：未发现无效 href 或缺失的本地目标。");
