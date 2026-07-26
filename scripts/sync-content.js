/**
 * 内容同步脚本 — 只负责 clone/更新私有内容仓库到 ./content/（gitignored）
 *
 * 不做 symlink/junction：内容的接入由 src/content.config.ts 里的 existsSync
 * 切换完成（content/blog/ 存在则集合直接从中读取）。Windows 上 git 会穿越
 * junction，把私有文章暴露进框架仓库工作区 —— 这是弃用 symlink 方案的原因。
 *
 * 使用方式：
 *   node scripts/sync-content.js
 *
 * 环境变量：
 *   ENABLE_CONTENT_SYNC - 是否启用同步 (true/false)
 *   CONTENT_REPO_URL    - 内容仓库地址
 *   CONTENT_DIR         - 内容目录 (默认 ./content)
 *   CONTENT_BRANCH      - 内容仓库分支 (默认 main)
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

// ===== 加载 .env 配置 =====
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    console.log("⚠️  未找到 .env 文件，使用默认配置");
    return {};
  }

  const env = {};
  const content = readFileSync(envPath, "utf-8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // 去除引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

// ===== 执行 Git 命令 =====
function git(cmd, cwd) {
  try {
    return execSync(`git ${cmd}`, {
      cwd: cwd || process.cwd(),
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();
  } catch {
    return null;
  }
}

// ===== 主同步逻辑 =====
async function main() {
  // .env 文件优先，回落到进程环境变量（CI 通过 env: 注入，没有 .env 文件）
  const env = { ...process.env, ...loadEnv() };

  // 检查是否启用同步
  if (env.ENABLE_CONTENT_SYNC !== "true") {
    console.log("⏭️  内容同步已禁用 (ENABLE_CONTENT_SYNC != true)");
    console.log("   使用本地 content/ 目录\n");
    process.exit(0);
  }

  const repoUrl = env.CONTENT_REPO_URL;
  if (!repoUrl) {
    console.error("❌ 未配置 CONTENT_REPO_URL");
    console.error("   请在 .env 文件中设置内容仓库地址\n");
    process.exit(1);
  }

  const contentDir = resolve(process.cwd(), env.CONTENT_DIR || "./content");
  const branch = env.CONTENT_BRANCH || "main";

  console.log("🔄 同步内容仓库...");
  console.log(`   仓库: ${repoUrl}`);
  console.log(`   分支: ${branch}`);
  console.log(`   目录: ${contentDir}\n`);

  // 克隆或更新内容仓库
  if (!existsSync(join(contentDir, ".git"))) {
    console.log(`📥 克隆内容仓库...`);
    try {
      execSync(
        `git clone --depth 1 -b ${branch} "${repoUrl}" "${contentDir}"`,
        { stdio: "inherit" }
      );
    } catch (err) {
      console.error("❌ 克隆失败:", err.message);
      process.exit(1);
    }
  } else {
    console.log("📥 更新内容仓库...");
    try {
      // 暂存本地修改
      execSync(`cd "${contentDir}" && git stash push --include-untracked`, {
        stdio: "pipe",
      });
    } catch {
      // stash 失败忽略（可能没有修改）
    }

    try {
      execSync(`cd "${contentDir}" && git fetch --all --prune`, {
        stdio: "pipe",
      });
      execSync(
        `cd "${contentDir}" && git checkout ${branch} && git reset --hard origin/${branch}`,
        { stdio: "inherit" }
      );
    } catch (err) {
      console.error("❌ 更新失败:", err.message);
      console.log("   将使用本地缓存的内容继续\n");
    }
  }

  // 无 symlink 阶段 —— src/content.config.ts 通过 existsSync 直接读 content/blog/
  if (existsSync(join(contentDir, "blog"))) {
    console.log("\n✅ 内容同步完成！构建将使用 content/blog/ 中的私有内容\n");
  } else {
    console.log("\n⚠️  内容仓库中未找到 blog/ 目录，构建将退回内置演示内容\n");
  }
}

main().catch((err) => {
  console.error("❌ 同步失败:", err.message);
  process.exit(1);
});
