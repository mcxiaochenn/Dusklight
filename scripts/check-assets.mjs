import { statSync } from "node:fs";
import { resolve } from "node:path";

const limit = 1024 * 1024;
const files = ["xiowo-bg-light.webp"];
const directory = resolve("public/images/bg");
const oversized = files
	.map((name) => ({ name, size: statSync(resolve(directory, name)).size }))
	.filter((file) => file.size > limit);

if (oversized.length) {
	console.error(`背景图超过 1 MiB：${oversized.map((file) => `${file.name} (${file.size} bytes)`).join(", ")}`);
	process.exit(1);
}

console.log("背景图大小检查通过。");
