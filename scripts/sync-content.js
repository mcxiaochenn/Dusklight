/**
 * 内容同步脚本
 * 参考 Mizuki 实现：clone + symlink 方式同步内容仓库
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
import {
  existsSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  cpSync,
  readFileSync,
  lstatSync,
} from "fs";
import { join, resolve, relative, dirname } from "path";

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

// ===== 检查是否为符号链接 =====
function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

// ===== 创建符号链接 =====
function createSymlink(src, dest, label) {
  // 如果目标是符号链接，直接删除
  if (isSymlink(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  // 如果目标已存在（非符号链接），先备份
  else if (existsSync(dest)) {
    const backup = dest + ".backup";
    console.log(`  📦 备份: ${label} -> ${backup}`);
    rmSync(backup, { recursive: true, force: true });
    cpSync(dest, backup, { recursive: true });
    rmSync(dest, { recursive: true, force: true });
  }

  // 确保父目录存在
  mkdirSync(dirname(dest), { recursive: true });

  try {
    // 尝试创建符号链接（junction 在 Windows 上不需要管理员权限）
    const relPath = relative(dirname(dest), src);
    symlinkSync(relPath, dest, "junction");
    console.log(`  🔗 ${label}: symlink created`);
    return true;
  } catch (err) {
    // 如果符号链接失败，回退到文件复制
    console.log(`  ⚠️  ${label}: symlink failed, using copy (${err.message})`);
    try {
      cpSync(src, dest, { recursive: true });
      console.log(`  📁 ${label}: copied`);
      return true;
    } catch (copyErr) {
      console.error(`  ❌ ${label}: copy failed (${copyErr.message})`);
      return false;
    }
  }
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
  const env = loadEnv();

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

  // 创建符号链接映射
  const mappings = [
    {
      src: join(contentDir, "blog"),
      dest: resolve("src/content"),
      label: "blog -> src/content",
    },
    {
      src: join(contentDir, "pages"),
      dest: resolve("src/content/pages"),
      label: "pages -> src/content/pages",
    },
    {
      src: join(contentDir, "data"),
      dest: resolve("src/data"),
      label: "data -> src/data",
    },
    {
      src: join(contentDir, "images"),
      dest: resolve("public/images"),
      label: "images -> public/images",
    },
  ];

  console.log("\n📂 创建内容映射...");
  let successCount = 0;

  for (const { src, dest, label } of mappings) {
    if (existsSync(src)) {
      if (createSymlink(src, dest, label)) {
        successCount++;
      }
    } else {
      console.log(`  ⏭️  跳过 (不存在): ${label}`);
    }
  }

  console.log(`\n✅ 内容同步完成！(${successCount}/${mappings.length} 映射成功)\n`);
}

main().catch((err) => {
  console.error("❌ 同步失败:", err.message);
  process.exit(1);
});
