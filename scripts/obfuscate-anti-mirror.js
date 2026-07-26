#!/usr/bin/env node
/**
 * 构建后混淆防镜像脚本
 * ─────────────────────────────────────────────────
 * 由 postbuild hook 调用，扫描 dist/*.html，
 * 将 <!-- __ANTI_MIRROR__ --> 替换为高度混淆版本。
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");
const MARKER = "<!-- __ANTI_MIRROR__ -->";

function randId(len = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const first = chars[Math.floor(Math.random() * chars.length)];
  return "_" + first + crypto.randomBytes(len).toString("hex").slice(0, len);
}

function randInt(min, max) {
  return min + crypto.randomBytes(1)[0] % (max - min + 1);
}

function xorEncode(str, key) {
  return Array.from(str).map((c) => c.charCodeAt(0) ^ key);
}

function findHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findHtml(full));
    else if (entry.name.endsWith(".html")) results.push(full);
  }
  return results;
}

function generateObfuscated() {
  const xorKey = randInt(1, 254);
  const v = {};
  for (const k of ["arr","key","dec","host","ok","tmp","res","i","ch","init","len"]) {
    v[k] = randId(8 + Math.floor(Math.random() * 6));
  }

  const hostEnc = xorEncode("blog.mcxiaochen.top", xorKey);

  const html =
    '<head><meta charset="utf-8"><title>站点提醒</title>' +
    '<style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;' +
    'font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#e0e0e0}' +
    '.c{text-align:center;max-width:480px;padding:2rem}h1{font-size:1.5rem;margin-bottom:.75rem;color:#fff}' +
    'p{line-height:1.7;color:#999;margin-bottom:1.5rem}a{display:inline-block;padding:.6rem 1.8rem;' +
    'border-radius:999px;background:#3b82f6;color:#fff;text-decoration:none;font-weight:500}' +
    'a:hover{background:#2563eb}</style></head><body><div class="c">' +
    '<h1>⚠️ 非官方镜像站点</h1>' +
    '<p>当前页面并非来自官方站点，' +
    '请访问原始内容以获得完整体验和最新更新。</p>' +
    '<a href="https://blog.mcxiaochen.top">前往官方站点</a></div></body>';
  const htmlEnc = xorEncode(html, xorKey);

  const dead = () => `\nvar ${randId()}=${randInt(100,999)};var ${randId()}=[];
for(var ${randId()}=0;${randId()}<${randInt(3,7)};${randId()}++){${randId()}.push(${randInt(0,255)}^${randInt(0,255)})}\n`;

  return `(function(${v.arr},${v.key}){
${dead()}
var ${v.dec}=function(a){var r="",l=a.length;for(var i=0;i<l;i++)r+=String.fromCharCode(a[i]^${v.key});return r};
var ${v.ok}=${v.dec}([${hostEnc.join(",")}]);
${dead()}
var ${v.host}=location.hostname;
if(${v.host}&&${v.host}!=="localhost"&&${v.host}.indexOf("127.")!==0
  &&${v.host}!=="[::1]"&&${v.host}!=="0.0.0.0"&&${v.host}!==${v.ok}){
document.documentElement.innerHTML=${v.dec}([${htmlEnc.join(",")}]);
}
${dead()}
})([${hostEnc.join(",")}],${xorKey});`;
}

// ── 主流程 ──
if (!fs.existsSync(DIST)) {
  console.log("⏭️  dist/ 不存在，跳过混淆");
  process.exit(0);
}

const obfuscated = generateObfuscated();
const htmlFiles = findHtml(DIST);
let replaced = 0;

for (const filePath of htmlFiles) {
  let content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes(MARKER)) continue;
  content = content.replace(MARKER, `<script>${obfuscated}</script>`);
  fs.writeFileSync(filePath, content, "utf-8");
  replaced++;
}

if (replaced > 0) {
  console.log(`  🔒 AntiMirror: ${replaced} 页已混淆`);
} else {
  console.log("  ⚠️  AntiMirror: 未找到标记，跳过");
}
