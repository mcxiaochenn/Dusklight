import aliases from "../config/comment-paths.json";

/** 和迁移脚本共用显式别名，文章 slug 不参与重新计算。 */
export function commentPageKey(pathname: string): string {
  const key = pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}/`;
  return (aliases as Record<string, string>)[key] || key;
}
