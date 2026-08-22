import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, test } from "node:test";

const syncScript = resolve("scripts/sync-content.js");
const temporaryDirectories = [];
const gitEnvironment = {
  ...process.env,
  GIT_CONFIG_COUNT: "3",
  GIT_CONFIG_KEY_0: "commit.gpgsign",
  GIT_CONFIG_VALUE_0: "false",
  GIT_CONFIG_KEY_1: "tag.gpgsign",
  GIT_CONFIG_VALUE_1: "false",
  GIT_CONFIG_KEY_2: "core.hooksPath",
  GIT_CONFIG_VALUE_2: join(tmpdir(), "dusklight-sync-content-no-hooks"),
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: gitEnvironment,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryGit(cwd, ...args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    env: gitEnvironment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function configureRepository(directory) {
  git(directory, "config", "user.name", "Sync Content Test");
  git(directory, "config", "user.email", "sync-content@example.invalid");
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "dusklight-sync-content-"));
  temporaryDirectories.push(root);

  const source = join(root, "source");
  const remote = join(root, "remote.git");
  const content = join(root, "content");

  mkdirSync(source);
  git(source, "init", "--initial-branch=main");
  configureRepository(source);
  write(join(source, ".gitattributes"), "* -text\n");
  write(join(source, "blog", "base.md"), "base\n");
  git(source, "add", ".gitattributes", "blog/base.md");
  git(source, "commit", "-m", "initial content");
  git(root, "clone", "--bare", source, remote);
  git(root, "clone", remote, content);
  configureRepository(content);

  return { root, source, remote, content };
}

function publish(remote, root, file, content) {
  const publisher = join(root, `publisher-${Date.now()}-${Math.random()}`);
  git(root, "clone", remote, publisher);
  configureRepository(publisher);
  write(join(publisher, file), content);
  git(publisher, "add", file);
  git(publisher, "commit", "-m", `update ${file}`);
  git(publisher, "push", "origin", "main");
  return git(publisher, "rev-parse", "HEAD");
}

function publishGitSymlink(remote, root, file, target) {
  const publisher = join(root, `publisher-link-${Date.now()}-${Math.random()}`);
  const linkTarget = join(root, `link-target-${Date.now()}-${Math.random()}`);
  git(root, "clone", remote, publisher);
  configureRepository(publisher);
  write(linkTarget, target);
  const blob = git(publisher, "hash-object", "-w", linkTarget);
  git(
    publisher,
    "update-index",
    "--add",
    "--cacheinfo",
    `120000,${blob},${file}`,
  );
  git(publisher, "commit", "-m", `add symlink ${file}`);
  git(publisher, "push", "origin", "main");
  return git(publisher, "rev-parse", "HEAD");
}

function runSync(root, remote, extraEnv = {}) {
  return spawnSync(process.execPath, [syncScript], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...gitEnvironment,
      ENABLE_CONTENT_SYNC: "true",
      CONTENT_REPO_URL: remote,
      CONTENT_DIR: "./content",
      CONTENT_BRANCH: "main",
      ...extraEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function repositorySnapshot(content) {
  return {
    head: git(content, "rev-parse", "HEAD"),
    branch: tryGit(content, "symbolic-ref", "--short", "HEAD"),
    stash: tryGit(content, "rev-parse", "--verify", "refs/stash"),
  };
}

function assertRepositorySnapshot(content, expected) {
  assert.deepEqual(repositorySnapshot(content), expected);
}

test("blog 下未跟踪文章会保留并跳过同步", () => {
  const fixture = createFixture();
  const article = join(fixture.content, "blog", "new-article.md");
  write(article, "unpublished article\n");
  publish(fixture.remote, fixture.root, "blog/remote.md", "remote\n");
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(article, "utf8"), "unpublished article\n");
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(existsSync(join(fixture.content, "blog", "remote.md")), false);
});

test("未暂存的跟踪文件修改会保留并跳过同步", () => {
  const fixture = createFixture();
  const article = join(fixture.content, "blog", "base.md");
  write(article, "local edit\n");
  publish(fixture.remote, fixture.root, "blog/remote.md", "remote\n");
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(article, "utf8"), "local edit\n");
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(existsSync(join(fixture.content, "blog", "remote.md")), false);
});

test("已暂存的跟踪文件修改会保留并跳过同步", () => {
  const fixture = createFixture();
  const article = join(fixture.content, "blog", "base.md");
  write(article, "staged edit\n");
  git(fixture.content, "add", "blog/base.md");
  publish(fixture.remote, fixture.root, "blog/remote.md", "remote\n");
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(article, "utf8"), "staged edit\n");
  assertRepositorySnapshot(fixture.content, before);
  assert.match(git(fixture.content, "diff", "--cached", "--name-only"), /blog\/base\.md/);
  assert.equal(existsSync(join(fixture.content, "blog", "remote.md")), false);
});

test("被 Git ignore 的 blog 草稿会保留并跳过同步", () => {
  const fixture = createFixture();
  const article = join(fixture.content, "blog", "ignored-draft.md");
  write(join(fixture.content, ".git", "info", "exclude"), "blog/ignored-draft.md\n");
  write(article, "local ignored draft\n");
  publish(
    fixture.remote,
    fixture.root,
    "blog/ignored-draft.md",
    "remote article\n",
  );
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(article, "utf8"), "local ignored draft\n");
  assertRepositorySnapshot(fixture.content, before);
});

test("仅有未跟踪 .obsidian 时仍可 fast-forward 且不触碰该目录", () => {
  const fixture = createFixture();
  const editorFile = join(fixture.content, ".obsidian", "workspace.json");
  write(editorFile, '{"local":true}\n');
  const remoteHead = publish(fixture.remote, fixture.root, "blog/remote.md", "remote\n");

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(fixture.content, "rev-parse", "HEAD"), remoteHead);
  assert.equal(readFileSync(editorFile, "utf8"), '{"local":true}\n');
  assert.equal(tryGit(fixture.content, "rev-parse", "--verify", "refs/stash"), null);
});

test("干净且落后时只做 fast-forward", () => {
  const fixture = createFixture();
  const remoteHead = publish(fixture.remote, fixture.root, "blog/remote.md", "remote\n");

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(fixture.content, "rev-parse", "HEAD"), remoteHead);
  assert.equal(readFileSync(join(fixture.content, "blog", "remote.md"), "utf8"), "remote\n");
});

test("本地与远端一致时不修改仓库", () => {
  const fixture = createFixture();
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(git(fixture.content, "status", "--porcelain"), "");
});

test("本地领先时保留本地提交并跳过同步", () => {
  const fixture = createFixture();
  write(join(fixture.content, "blog", "local.md"), "local\n");
  git(fixture.content, "add", "blog/local.md");
  git(fixture.content, "commit", "-m", "local commit");
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(readFileSync(join(fixture.content, "blog", "local.md"), "utf8"), "local\n");
});

test("分支分叉时返回失败且不修改工作树", () => {
  const fixture = createFixture();
  write(join(fixture.content, "blog", "local.md"), "local\n");
  git(fixture.content, "add", "blog/local.md");
  git(fixture.content, "commit", "-m", "local commit");
  publish(fixture.remote, fixture.root, "blog/remote.md", "remote\n");
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(readFileSync(join(fixture.content, "blog", "local.md"), "utf8"), "local\n");
  assert.equal(existsSync(join(fixture.content, "blog", "remote.md")), false);
});

test("当前分支错误时跳过同步且不自动切换", () => {
  const fixture = createFixture();
  git(fixture.content, "switch", "-c", "draft");
  const before = repositorySnapshot(fixture.content);
  publish(fixture.remote, fixture.root, "blog/remote.md", "remote\n");

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(existsSync(join(fixture.content, "blog", "remote.md")), false);
});

test("CONTENT_DIR 指向项目根目录时拒绝运行", () => {
  const fixture = createFixture();
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote, { CONTENT_DIR: "." });

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
});

test("CONTENT_DIR 指向项目外部时拒绝运行", () => {
  const fixture = createFixture();
  const outside = mkdtempSync(join(tmpdir(), "dusklight-sync-outside-"));
  temporaryDirectories.push(outside);
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote, {
    CONTENT_DIR: outside,
  });

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(existsSync(join(outside, ".git")), false);
});

test("CONTENT_DIR 经过符号链接或目录联接时拒绝运行", () => {
  const fixture = createFixture();
  const linkedContent = join(fixture.root, "linked-content");
  symlinkSync(
    fixture.content,
    linkedContent,
    process.platform === "win32" ? "junction" : "dir",
  );
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote, {
    CONTENT_DIR: "./linked-content",
  });

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
});

test("content/blog 是指向仓库外的符号链接或目录联接时拒绝运行", () => {
  const fixture = createFixture();
  const outsideBlog = join(fixture.root, "outside-blog");
  mkdirSync(outsideBlog);
  write(join(outsideBlog, "base.md"), "base\n");
  rmSync(join(fixture.content, "blog"), { recursive: true });
  symlinkSync(
    outsideBlog,
    join(fixture.content, "blog"),
    process.platform === "win32" ? "junction" : "dir",
  );
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(readFileSync(join(outsideBlog, "base.md"), "utf8"), "base\n");
});

test("content/blog 内的嵌套目录联接指向仓库外时拒绝运行", () => {
  const fixture = createFixture();
  const posts = join(fixture.content, "blog", "posts");
  const outsidePosts = join(fixture.root, "outside-posts");
  write(join(posts, "base.md"), "nested base\n");
  git(fixture.content, "add", "blog/posts/base.md");
  git(fixture.content, "commit", "-m", "add nested post");
  git(fixture.content, "push", "origin", "main");
  write(join(outsidePosts, "base.md"), "nested base\n");
  rmSync(posts, { recursive: true });
  symlinkSync(
    outsidePosts,
    posts,
    process.platform === "win32" ? "junction" : "dir",
  );
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(
    readFileSync(join(outsidePosts, "base.md"), "utf8"),
    "nested base\n",
  );
});

test("远端更新引入 blog 符号链接时拒绝 fast-forward", () => {
  const fixture = createFixture();
  const before = repositorySnapshot(fixture.content);
  publishGitSymlink(
    fixture.remote,
    fixture.root,
    "blog/external-posts",
    "../../outside-posts",
  );

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(existsSync(join(fixture.content, "blog", "external-posts")), false);
});

test("本地领先且已删除远端祖先中的符号链接时正常跳过同步", () => {
  const fixture = createFixture();
  publishGitSymlink(
    fixture.remote,
    fixture.root,
    "blog/obsolete-link",
    "../../outside-posts",
  );
  git(fixture.content, "fetch", "origin");
  git(fixture.content, "merge", "--ff-only", "origin/main");
  git(fixture.content, "rm", "blog/obsolete-link");
  git(fixture.content, "commit", "-m", "remove obsolete symlink");
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(existsSync(join(fixture.content, "blog", "obsolete-link")), false);
});

test("继承的 Git 工作树环境变量不会改变操作目标", () => {
  const fixture = createFixture();
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote, {
    GIT_DIR: join(fixture.source, ".git"),
    GIT_WORK_TREE: fixture.source,
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
});

test("origin 与配置仓库不一致时拒绝同步", () => {
  const fixture = createFixture();
  git(fixture.content, "remote", "set-url", "origin", fixture.source);
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assertRepositorySnapshot(fixture.content, before);
});

test("origin 不一致但存在未跟踪文章时优先保留本地内容", () => {
  const fixture = createFixture();
  const article = join(fixture.content, "blog", "local-draft.md");
  write(article, "local draft\n");
  git(fixture.content, "remote", "set-url", "origin", fixture.source);
  const before = repositorySnapshot(fixture.content);

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(readFileSync(article, "utf8"), "local draft\n");
  assertRepositorySnapshot(fixture.content, before);
});

test("detached HEAD 时跳过同步且不切换分支", () => {
  const fixture = createFixture();
  git(fixture.content, "switch", "--detach", "HEAD");
  const before = repositorySnapshot(fixture.content);
  publish(fixture.remote, fixture.root, "blog/remote.md", "remote\n");

  const result = runSync(fixture.root, fixture.remote);

  assert.equal(result.status, 0, result.stderr);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(existsSync(join(fixture.content, "blog", "remote.md")), false);
});

test("已有缓存时 fetch 失败会保留内容并成功退出", () => {
  const fixture = createFixture();
  const before = repositorySnapshot(fixture.content);
  const missingRemote = join(fixture.root, "missing.git");
  git(fixture.content, "remote", "set-url", "origin", missingRemote);

  const result = runSync(fixture.root, missingRemote);

  assert.equal(result.status, 0, result.stderr);
  assertRepositorySnapshot(fixture.content, before);
  assert.equal(readFileSync(join(fixture.content, "blog", "base.md"), "utf8"), "base\n");
});

test("fetch 失败且没有 blog 缓存时返回非零", () => {
  const fixture = createFixture();
  rmSync(join(fixture.content, "blog"), { recursive: true });
  git(fixture.content, "add", "--all", "blog");
  git(fixture.content, "commit", "-m", "remove blog cache");
  const missingRemote = join(fixture.root, "missing.git");
  git(fixture.content, "remote", "set-url", "origin", missingRemote);

  const result = runSync(fixture.root, missingRemote);

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.equal(existsSync(join(fixture.content, "blog")), false);
});

test("首次 clone 失败会明确返回非零", () => {
  const root = mkdtempSync(join(tmpdir(), "dusklight-sync-content-clone-"));
  temporaryDirectories.push(root);

  const result = runSync(root, join(root, "missing.git"));

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.equal(existsSync(join(root, "content", ".git")), false);
});

test("内容仓库状态读取失败时返回非零", () => {
  const root = mkdtempSync(join(tmpdir(), "dusklight-sync-content-status-"));
  temporaryDirectories.push(root);
  mkdirSync(join(root, "content", ".git"), { recursive: true });

  const result = runSync(root, join(root, "remote.git"));

  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
});
