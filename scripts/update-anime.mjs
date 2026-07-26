/**
 * 追番数据拉取 — Bilibili 公开追番列表 → src/data/bilibili-data.json
 *
 * 挂在 build 链：`node scripts/update-anime.mjs && astro build`。
 * 完全 fail-soft：任何失败（网络/风控/配置缺失）都 exit 0，
 * 构建退回已有 json 或空数据，绝不阻塞构建。
 *
 * 可选环境变量 BILI_SESSDATA（B 站登录 cookie，能拿到更全的观看进度；
 * CI 中放 GitHub Secrets，切勿提交）。
 */
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_FILE = path.join(ROOT, "src/data/bilibili-data.json");
const API = "https://api.bilibili.com/x/space/bangumi/follow/list";
const PAGE_SIZE = 30;
// 1=想看 2=在看 3=已看
const STATUS_MAP = { 1: "planned", 2: "watching", 3: "completed" };

function readVmid() {
	const cfg = readFileSync(path.join(ROOT, "src/config/site.ts"), "utf-8");
	const m = cfg.match(/anime:\s*\{[\s\S]*?vmid:\s*["']([^"']+)["']/);
	return m?.[1] ?? "";
}

// .env 极简加载（只为本地拿 BILI_SESSDATA，无第三方依赖）
function loadDotEnv() {
	const envPath = path.join(ROOT, ".env");
	if (!existsSync(envPath)) return;
	for (const line of readFileSync(envPath, "utf-8").split("\n")) {
		const t = line.trim();
		if (!t || t.startsWith("#")) continue;
		const eq = t.indexOf("=");
		if (eq === -1) continue;
		const k = t.slice(0, eq).trim();
		if (!(k in process.env)) process.env[k] = t.slice(eq + 1).trim();
	}
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, headers) {
	for (let i = 0; i < 3; i++) {
		try {
			const res = await fetch(url, { headers });
			const json = await res.json();
			if (json?.code === 0) return json;
			throw new Error(json?.message || `code ${json?.code}`);
		} catch (e) {
			if (i === 2) throw e;
			await delay(1000);
		}
	}
}

function mapItem(bangumi, status) {
	let cover = bangumi?.cover || "";
	if (cover.startsWith("http://")) cover = cover.replace("http://", "https://");
	if (cover && !cover.includes("@")) cover += "@220w_280h.webp";

	let progress = 0;
	if (typeof bangumi?.progress === "string") {
		progress = Number.parseInt(bangumi.progress.match(/(\d+)/)?.[1] ?? "0", 10) || 0;
	} else if (typeof bangumi?.progress === "number") {
		progress = bangumi.progress;
	}
	const totalEpisodes = bangumi?.total_count > 0 ? bangumi.total_count : 0;
	const progressPercent =
		totalEpisodes > 0 && progress > 0 ? Math.round((progress / totalEpisodes) * 100) : 0;

	const year = (bangumi?.publish?.release_date || bangumi?.publish?.pub_time || "").match(/^(\d{4})/)?.[1] ?? "";

	let link = "#";
	if (bangumi?.url) link = bangumi.url;
	else if (bangumi?.season_id) link = `https://www.bilibili.com/bangumi/play/ss${bangumi.season_id}`;
	else if (bangumi?.media_id) link = `https://www.bilibili.com/bangumi/media/md${bangumi.media_id}/`;

	return {
		title: bangumi?.title || "Unknown",
		status: STATUS_MAP[status] || "planned",
		rating: bangumi?.rating?.score ? Number.parseFloat(bangumi.rating.score.toFixed(1)) : 0,
		cover,
		year,
		studio: bangumi?.areas?.[0]?.name || "",
		link,
		progress,
		totalEpisodes,
		progressPercent,
	};
}

async function main() {
	loadDotEnv();
	const vmid = readVmid();
	if (!vmid) {
		console.log("[anime] siteConfig.anime.vmid 未配置，跳过追番数据更新");
		return;
	}
	const headers = process.env.BILI_SESSDATA
		? { cookie: `SESSDATA=${process.env.BILI_SESSDATA};` }
		: {};

	const all = [];
	for (const status of [2, 3, 1]) {
		const first = await fetchJson(
			`${API}?type=1&follow_status=${status}&vmid=${vmid}&ps=${PAGE_SIZE}&pn=1`,
			headers,
		);
		const total = first?.data?.total ?? 0;
		const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
		all.push(...(first?.data?.list || []).map((b) => mapItem(b, status)));
		for (let pn = 2; pn <= pages; pn++) {
			await delay(400);
			const json = await fetchJson(
				`${API}?type=1&follow_status=${status}&vmid=${vmid}&ps=${PAGE_SIZE}&pn=${pn}`,
				headers,
			);
			all.push(...(json?.data?.list || []).map((b) => mapItem(b, status)));
		}
	}

	await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
	await fs.writeFile(OUTPUT_FILE, JSON.stringify(all, null, "\t"));
	console.log(`[anime] 已更新 ${all.length} 部番剧 → src/data/bilibili-data.json`);
}

main().catch((err) => {
	console.warn(`[anime] 拉取失败（${err.message}），使用已有数据继续构建`);
	process.exit(0);
});
