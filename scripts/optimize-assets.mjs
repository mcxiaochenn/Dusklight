import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const limit = 1024 * 1024;
const path = resolve("public/images/bg/xiowo-bg-light.webp");
const original = await readFile(path);

if (original.length <= limit) {
	console.log("浅色背景图已不超过 1 MiB，无需处理。");
	process.exit(0);
}

for (let quality = 90; quality >= 50; quality -= 5) {
	const output = await sharp(original).webp({ quality }).toBuffer();
	if (output.length <= limit) {
		await writeFile(path, output);
		console.log(`浅色背景图已压缩至 ${output.length} bytes（quality=${quality}）。`);
		process.exit(0);
	}
}

throw new Error("浅色背景图无法在 quality >= 50 时压缩至 1 MiB；请人工调整源图。");
