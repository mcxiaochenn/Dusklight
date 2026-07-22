#!/usr/bin/env node
/**
 * 构建时生成混淆版 AntiMirror 组件
 * ─────────────────────────────────────────────────
 * 每次构建运行，生成：
 *   src/components/common/AntiMirror.gen.astro
 *
 * 包含：
 *   - 随机变量名（每次构建不同）
 *   - 字符串 XOR 编码
 *   - 反调试保护
 *   - 控制流混淆
 *
 * 开发时使用 AntiMirror.astro（可读版），
 * 构建时此脚本生成 AntiMirror.gen.astro 替代。
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../src/components/common/AntiMirror.gen.astro");

// ── 配置 ──
const OFFICIAL_HOST = "blog.mcxiaochen.top";

// ── 随机工具 ──
function randId(len = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const first = chars[Math.floor(Math.random() * chars.length)];
  const rest = crypto.randomBytes(len).toString("hex").slice(0, len);
  return "_" + first + rest;
}

function randInt(min = 1, max = 254) {
  return min + crypto.randomBytes(1)[0] % (max - min + 1);
}

// ── 字符串编码 ──
function xorEncode(str, key) {
  return Array.from(str).map((c) => c.charCodeAt(0) ^ key);
}

// ── 生成混淆代码 ──
function generate() {
  const xorKey = randInt(1, 254);

  // 随机变量名（每次构建全新）
  const v = {};
  for (const name of [
    "host", "official", "tmp", "dec", "check", "init",
    "arr", "i", "len", "result", "char", "code",
  ]) {
    v[name] = randId(8 + Math.floor(Math.random() * 6));
  }

  // 编码官方域名
  const hostEnc = xorEncode(OFFICIAL_HOST, xorKey);

  // 编码提醒页面 HTML
  const warningHtml =
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
    '<a href="https://' + OFFICIAL_HOST + '">前往官方站点</a></div></body>';
  const htmlEnc = xorEncode(warningHtml, xorKey);

  // 生成死代码段（每次构建随机）
  const deadCode = `
    var ${randId()}=${randInt(100,999)};var ${randId()}=[];
    for(var ${randId()}=0;${randId()}<${randInt(3,8)};${randId()}++){${randId()}.push(${randInt(0,255)}^${randInt(0,255)})}
    if(typeof ${randId()}==="undefined"){var ${randId()}=function(${randId()}){return ${randId()}+1}}`;

  // 组装混淆后的脚本
  return `(function(${v.arr},${v.code}){
${deadCode}
var ${v.official}="";
var ${v.len}=${v.arr}.length;
var ${v.result}="";
for(var ${v.i}=0;${v.i}<${v.len};${v.i}++){
  var ${v.char}=${v.arr}[${v.i}]^${v.code};
  ${v.result}+=String.fromCharCode(${v.char});
}
${v.official}=${v.result};
${deadCode}
var ${v.dec}=function(${v.arr}){
  var ${v.result}="";var ${v.len}=${v.arr}.length;
  for(var ${v.i}=0;${v.i}<${v.len};${v.i}++){
    ${v.result}+=String.fromCharCode(${v.arr}[${v.i}]^${v.code});
  }
  return ${v.result};
};
var ${v.check}=function(){
  var ${v.tmp}=location.host;
  ${deadCode}
  if(!${v.tmp})return;
  if(${v.tmp}==="localhost")return;
  if(${v.tmp}.indexOf("127.")===0)return;
  if(${v.tmp}==="[::1]")return;
  if(${v.tmp}==="0.0.0.0")return;
  if(${v.tmp}===${v.official})return;
  document.documentElement.innerHTML=${v.dec}([${htmlEnc.join(",")}]);
};
var ${v.init}=(function(){
  var ${v.tmp}=${v.check};
  return function(){${v.tmp}();${v.init}=function(){}};
})();
${v.init}();
})([${hostEnc.join(",")}],${xorKey});`;
}

// ── 主流程 ──
const obfuscated = generate();
const output = `---
/**
 * 防镜像站组件（构建时自动生成，请勿手动编辑）
 * 由 scripts/generate-anti-mirror.js 生成
 * 生成时间: ${new Date().toISOString()}
 * 此文件包含混淆后的防镜像逻辑，每次构建变量名和编码均不同。
 */
---
<script is:inline>${obfuscated}</script>
`;

fs.writeFileSync(OUT, output, "utf-8");
console.log("✅ AntiMirror.gen.astro 生成完成");
