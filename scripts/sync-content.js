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

import { spawnSync } from "child_process";
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
} from "fs";
import { isAbsolute, join, relative, resolve, sep } from "path";

const gitEnvironment = { ...process.env };
for (const key of [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_OBJECT_DIRECTORY",
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_NAMESPACE",
]) {
  delete gitEnvironment[key];
}

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

// ===== 执行 Git 命令（参数数组，避免 shell 注入）=====
function git(args, cwd) {
  const result = spawnSync("git", args, {
    cwd: cwd || process.cwd(),
    env: gitEnvironment,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf-8",
  });

  if (result.error) throw result.error;

  return {
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function formatRepositoryForLog(value) {
  return value
    .replaceAll(/\/\/[^@/\s]+@/g, "//***@")
    .replace(/[?#].*$/, "");
}

function isDescendant(root, target) {
  const pathFromRoot = relative(root, target);
  return (
    pathFromRoot !== "" &&
    pathFromRoot !== ".." &&
    !pathFromRoot.startsWith(`..${sep}`) &&
    !isAbsolute(pathFromRoot)
  );
}

function validateContentPath(configuredDir) {
  let projectRoot;
  try {
    projectRoot = realpathSync(process.cwd());
  } catch (err) {
    return { error: `无法解析项目根目录: ${err.message}` };
  }

  const contentDir = resolve(projectRoot, configuredDir || "./content");
  if (!isDescendant(projectRoot, contentDir)) {
    return { error: "CONTENT_DIR 必须是项目根目录下的独立子目录" };
  }

  const segments = relative(projectRoot, contentDir).split(sep).filter(Boolean);
  let current = projectRoot;
  try {
    for (const segment of segments) {
      current = join(current, segment);
      if (!existsSync(current)) continue;
      if (lstatSync(current).isSymbolicLink()) {
        return { error: `CONTENT_DIR 不得经过符号链接或目录联接: ${current}` };
      }
      const canonicalCurrent = realpathSync(current);
      if (
        canonicalCurrent !== projectRoot &&
        !isDescendant(projectRoot, canonicalCurrent)
      ) {
        return { error: "CONTENT_DIR 的实际路径超出项目根目录" };
      }
    }
  } catch (err) {
    return { error: `无法验证 CONTENT_DIR: ${err.message}` };
  }

  return { contentDir, projectRoot };
}

function validateRepository(contentDir) {
  const insideWorkTree = git(
    ["rev-parse", "--is-inside-work-tree"],
    contentDir,
  );
  const prefix = git(["rev-parse", "--show-prefix"], contentDir);
  if (
    insideWorkTree.status !== 0 ||
    insideWorkTree.stdout !== "true" ||
    prefix.status !== 0
  ) {
    return { error: "content 目录不是有效的 Git 工作树" };
  }
  if (prefix.stdout !== "") {
    return { error: "content 目录不是当前 Git 工作树的顶层目录" };
  }

  return {};
}

function validateBlogPath(contentDir) {
  const blogDir = join(contentDir, "blog");

  try {
    if (!existsSync(blogDir)) return {};

    const canonicalContentDir = realpathSync(contentDir);
    const pending = [blogDir];

    while (pending.length > 0) {
      const current = pending.pop();
      const stat = lstatSync(current);
      if (stat.isSymbolicLink()) {
        return { error: `content/blog 不得包含符号链接或目录联接: ${current}` };
      }

      const canonicalCurrent = realpathSync(current);
      if (!isDescendant(canonicalContentDir, canonicalCurrent)) {
        return { error: "content/blog 的实际路径超出内容仓库" };
      }

      if (stat.isDirectory()) {
        for (const name of readdirSync(current)) {
          pending.push(join(current, name));
        }
      }
    }
  } catch (err) {
    return { error: `无法验证 content/blog: ${err.message}` };
  }

  return {};
}

function validateGitBlogTree(contentDir, treeish) {
  const tree = git(
    ["ls-tree", "-r", "-z", treeish, "--", "blog"],
    contentDir,
  );
  if (tree.status !== 0) {
    return { error: `无法验证 ${treeish} 中的 blog Git 树` };
  }

  const hasSymlink = tree.stdout
    .split("\0")
    .filter(Boolean)
    .some((entry) => entry.startsWith("120000 "));
  if (hasSymlink) {
    return { error: `${treeish} 中的 blog Git 树包含符号链接，拒绝同步` };
  }

  return {};
}

function validateCheckedOutBlog(contentDir, treeish = "HEAD") {
  const blogPath = validateBlogPath(contentDir);
  if (blogPath.error) return blogPath;
  return validateGitBlogTree(contentDir, treeish);
}

function normalizeRemoteUrl(value, baseDir) {
  const withoutSecrets = value
    .replaceAll(/\/\/[^@/\s]+@/g, "//")
    .replace(/[?#].*$/, "")
    .replace(/[\\/]+$/, "")
    .replace(/\.git$/i, "");

  if (
    withoutSecrets.startsWith(".") ||
    withoutSecrets.startsWith("/") ||
    /^[a-zA-Z]:[\\/]/.test(withoutSecrets)
  ) {
    const normalized = resolve(baseDir, withoutSecrets);
    return process.platform === "win32" ? normalized.toLowerCase() : normalized;
  }

  return withoutSecrets;
}

function hasProtectedLocalChanges(statusOutput) {
  const entries = statusOutput.split("\0").filter(Boolean);

  return entries.some((entry) => {
    const state = entry.slice(0, 2);
    const path = entry.slice(3).replaceAll("\\", "/");

    if (state === "??" || state === "!!") {
      return path === "blog" || path.startsWith("blog/");
    }
    return true;
  });
}

function reportContentSource(contentDir) {
  // 无 symlink 阶段 —— src/content.config.ts 通过 existsSync 直接读 content/blog/
  if (existsSync(join(contentDir, "blog"))) {
    console.log("\n✅ 本地 content/blog 可用，构建将使用私有内容\n");
  } else {
    console.log("\n⚠️  内容仓库中未找到 blog/ 目录，构建将退回内置演示内容\n");
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
    return 0;
  }

  const repoUrl = env.CONTENT_REPO_URL;
  if (!repoUrl) {
    console.error("❌ 未配置 CONTENT_REPO_URL");
    console.error("   请在 .env 文件中设置内容仓库地址\n");
    return 1;
  }

  const contentPath = validateContentPath(env.CONTENT_DIR);
  if (contentPath.error) {
    console.error(`❌ ${contentPath.error}`);
    return 1;
  }
  const { contentDir, projectRoot } = contentPath;
  const branch = env.CONTENT_BRANCH || "main";

  console.log("🔄 同步内容仓库...");
  // CONTENT_REPO_URL 按约定内嵌 PAT（https://<PAT>@github.com/...），
  // 原样打印会让构建日志携带凭据 —— 打印前抹掉 userinfo 段
  console.log(`   仓库: ${formatRepositoryForLog(repoUrl)}`);
  console.log(`   分支: ${branch}`);
  console.log(`   目录: ${contentDir}\n`);

  // 克隆或更新内容仓库
  if (!existsSync(join(contentDir, ".git"))) {
    console.log(`📥 克隆内容仓库...`);
    const cloneResult = git(
      ["clone", "-b", branch, repoUrl, contentDir],
      projectRoot,
    );
    if (cloneResult.status !== 0) {
      console.error("❌ 克隆失败，请检查仓库地址、凭据和网络状态");
      return 1;
    }

    const blogPath = validateCheckedOutBlog(contentDir);
    if (blogPath.error) {
      console.error(`❌ ${blogPath.error}`);
      return 1;
    }
  } else {
    console.log("📥 更新内容仓库...");

    const repository = validateRepository(contentDir);
    if (repository.error) {
      console.error(`❌ ${repository.error}`);
      return 1;
    }

    const blogPath = validateCheckedOutBlog(contentDir);
    if (blogPath.error) {
      console.error(`❌ ${blogPath.error}`);
      return 1;
    }

    const status = git(
      [
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
        "--ignored=matching",
      ],
      contentDir,
    );
    if (status.status !== 0) {
      console.error(`❌ 无法读取内容仓库状态: ${status.stderr || "未知错误"}`);
      return 1;
    }

    if (hasProtectedLocalChanges(status.stdout)) {
      console.warn("⚠️  检测到本地内容改动，跳过同步并继续使用本地内容\n");
      reportContentSource(contentDir);
      return 0;
    }

    const currentBranch = git(
      ["symbolic-ref", "--quiet", "--short", "HEAD"],
      contentDir,
    );
    if (currentBranch.status !== 0) {
      console.warn("⚠️  内容仓库处于 detached HEAD，跳过同步\n");
      reportContentSource(contentDir);
      return 0;
    }
    if (currentBranch.stdout !== branch) {
      console.warn(
        `⚠️  内容仓库当前分支为 ${currentBranch.stdout}，不是 ${branch}，跳过同步\n`,
      );
      reportContentSource(contentDir);
      return 0;
    }

    const originUrl = git(["remote", "get-url", "origin"], contentDir);
    if (originUrl.status !== 0) {
      console.error("❌ 内容仓库缺少 origin 远端");
      return 1;
    }
    if (
      normalizeRemoteUrl(originUrl.stdout, projectRoot) !==
      normalizeRemoteUrl(repoUrl, projectRoot)
    ) {
      console.error("❌ 内容仓库 origin 与 CONTENT_REPO_URL 不一致，拒绝同步");
      return 1;
    }

    const fetchResult = git(["fetch", "origin"], contentDir);
    if (fetchResult.status !== 0) {
      if (!existsSync(join(contentDir, "blog"))) {
        console.error("❌ 拉取远端内容失败，且本地没有可用的 content/blog 缓存");
        return 1;
      }
      console.warn("⚠️  拉取远端内容失败，将使用本地缓存的内容继续");
      reportContentSource(contentDir);
      return 0;
    }

    const remoteRef = `refs/remotes/origin/${branch}`;
    const localHead = git(["rev-parse", "HEAD"], contentDir);
    const remoteHead = git(["rev-parse", "--verify", remoteRef], contentDir);
    if (localHead.status !== 0 || remoteHead.status !== 0) {
      console.error(`❌ 无法确定本地与远端 ${branch} 分支的提交状态`);
      return 1;
    }

    if (localHead.stdout === remoteHead.stdout) {
      console.log("✅ 内容仓库已是最新状态");
    } else {
      const remoteCommit = remoteHead.stdout;
      const localIsAncestor = git(
        ["merge-base", "--is-ancestor", "HEAD", remoteCommit],
        contentDir,
      );
      const remoteIsAncestor = git(
        ["merge-base", "--is-ancestor", remoteCommit, "HEAD"],
        contentDir,
      );

      if (localIsAncestor.status === 0) {
        const remoteBlogTree = validateGitBlogTree(contentDir, remoteCommit);
        if (remoteBlogTree.error) {
          console.error(`❌ ${remoteBlogTree.error}`);
          return 1;
        }

        const mergeResult = git(
          ["merge", "--ff-only", remoteCommit],
          contentDir,
        );
        if (mergeResult.status !== 0) {
          console.error("❌ 内容仓库 fast-forward 失败，工作树保持原状");
          return 1;
        }
        const mergedBlogPath = validateCheckedOutBlog(contentDir);
        if (mergedBlogPath.error) {
          console.error(`❌ ${mergedBlogPath.error}`);
          return 1;
        }
        console.log("✅ 内容仓库已 fast-forward 到远端最新提交");
      } else if (remoteIsAncestor.status === 0) {
        console.warn("⚠️  内容仓库包含尚未推送的本地提交，跳过同步\n");
      } else if (
        localIsAncestor.status === 1 &&
        remoteIsAncestor.status === 1
      ) {
        console.error("❌ 内容仓库本地与远端分支已分叉，请人工处理");
        return 1;
      } else {
        console.error("❌ 无法判断内容仓库本地与远端的提交关系");
        return 1;
      }
    }
  }

  reportContentSource(contentDir);
  return 0;
}

main().then((exitCode) => {
  process.exitCode = exitCode;
}).catch((err) => {
  console.error("❌ 同步失败:", err.message);
  process.exitCode = 1;
});
