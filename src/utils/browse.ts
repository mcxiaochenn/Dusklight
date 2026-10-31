import type { CollectionEntry } from "astro:content";
export type BrowsePost = CollectionEntry<"blog">;
/** 同一篇文章的重复标签只计一次，索引与详情共用归组结果。 */
export function groupTopics(posts: BrowsePost[], kind: "tags" | "categories") {
  const groups = new Map<string, BrowsePost[]>();
  for (const post of posts) {
    const names = kind === "tags" ? post.data.tags : [post.data.category || ""];
    for (const name of new Set(names.map((name) => name.trim()).filter(Boolean))) {
      const items = groups.get(name) || [];
      items.push(post);
      groups.set(name, items);
    }
  }
  return [...groups].map(([name, items]) => ({
    name, count: items.length,
    posts: [...items].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()),
  })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}
