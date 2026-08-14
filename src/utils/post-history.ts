import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

export interface PostCommit {
  hash: string;
  date: string;
  subject: string;
}

function findContentFile(root: string, postId: string): string | undefined {
  const absolute = resolve(postId);
  if (existsSync(absolute) && absolute.startsWith(root)) return absolute;
  const normalizedId = postId.replace(/\\/g, "/").replace(/\.(md|mdx)$/i, "");
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if ([".md", ".mdx"].includes(extname(entry.name).toLowerCase())) files.push(path);
    }
  };
  walk(root);
  return files.find((path) => {
    const candidate = relative(root, path).replace(/\\/g, "/").replace(/\.(md|mdx)$/i, "");
    return candidate === normalizedId || candidate.endsWith(`/${normalizedId}`);
  });
}

export function getPostHistory(postId: string): PostCommit[] {
  const contentRoot = resolve(process.cwd(), "content");
  const postsRoot = join(contentRoot, "blog", "posts");
  if (!existsSync(join(contentRoot, ".git")) || !existsSync(postsRoot)) return [];

  try {
    const file = findContentFile(postsRoot, postId);
    if (!file) return [];
    const pathspec = relative(contentRoot, file).replace(/\\/g, "/");
    const raw = execFileSync(
      "git",
      ["-c", `safe.directory=${contentRoot.replace(/\\/g, "/")}`, "log", "--follow", "--pretty=format:%h|%ad|%s", "--date=format:%Y-%m-%d", "--", pathspec],
      { cwd: contentRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return raw ? raw.split("\n").map((line) => {
      const [hash, date, ...subject] = line.split("|");
      return { hash, date, subject: subject.join("|") };
    }) : [];
  } catch {
    return [];
  }
}
