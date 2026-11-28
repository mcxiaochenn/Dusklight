import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const MIB = 1024 * 1024;
const publicDir = resolve("public/images/bg");
const distDir = resolve("dist");

function checkFiles(label, files, limit) {
	const oversized = files
		.map((file) => ({ name: file, size: statSync(file).size }))
		.filter((file) => file.size > limit);

	if (oversized.length) {
		console.error(`${label}超过预算：${oversized.map((file) => `${file.name} (${file.size} bytes)`).join(", ")}`);
		process.exit(1);
	}
}

function checkTotal(label, files, limit) {
	const total = files.reduce((sum, file) => sum + statSync(file).size, 0);
	if (total > limit) {
		console.error(`${label}超过预算：${total} bytes（上限 ${limit} bytes）`);
		process.exit(1);
	}
}

function getAttribute(tag, name) {
	return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1];
}

function toDistFile(href) {
	return resolve(distDir, href.replace(/^[\\/]+/, "").split(/[?#]/, 1)[0]);
}

const backgroundImages = ["xiowo-bg-light.webp", "xiowo-bg-dark.webp"].map((name) => resolve(publicDir, name));
checkFiles("背景图", backgroundImages, MIB);

const homepage = readFileSync(resolve(distDir, "index.html"), "utf8");
const links = [...homepage.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
const chineseFontLinks = links
	.filter((tag) => getAttribute(tag, "rel") === "stylesheet")
	.map((tag) => getAttribute(tag, "href"))
	.filter((href) => href?.includes("cn-font.claude-code-best.win"));
const homepageStyles = links
	.filter((tag) => getAttribute(tag, "rel") === "stylesheet")
	.map((tag) => getAttribute(tag, "href"))
	.filter((href) => href && !/^https?:\/\//i.test(href))
	.map(toDistFile);

if (chineseFontLinks.length < 2) {
	console.error("首页未正确引入中文网字计划字体分包样式（寒蝉全圆体与 Maple Mono CN）。");
	process.exit(1);
}

checkTotal("首页本地样式总量", homepageStyles, 130 * 1024);

console.log("资源大小检查通过。");
