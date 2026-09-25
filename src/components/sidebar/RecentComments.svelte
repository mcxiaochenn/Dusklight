<script lang="ts">
  import { onMount } from "svelte";

  interface RecentCommentResponse {
    avatar?: string;
    comment?: string;
    commentText?: string;
    created: string | number;
    id: string;
    nick: string;
    url?: string;
  }

  interface RecentComment {
    avatar?: string;
    content: string;
    created: string | number;
    id: string;
    nick: string;
    href?: string;
  }

  let {
    envId,
    siteUrl,
    limit,
    includeReply,
  }: {
    envId: string;
    siteUrl: string;
    limit: number;
    includeReply: boolean;
  } = $props();

  let comments = $state<RecentComment[]>([]);
  let status = $state<"loading" | "ready" | "empty" | "error">("loading");
  let controller: AbortController | undefined;

  function plainText(value: string): string {
    if (!value) return "";
    const parsed = new DOMParser().parseFromString(value, "text/html");
    return parsed.body.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  function normalizeHref(url: string | undefined, id: string): string | undefined {
    if (!url) return undefined;
    try {
      const target = new URL(url, siteUrl);
      const canonical = new URL(siteUrl);
      if (target.origin !== canonical.origin && target.origin !== window.location.origin) return undefined;
      return `${target.pathname}${target.search}#${encodeURIComponent(id)}`;
    } catch {
      return undefined;
    }
  }

  function normalize(items: RecentCommentResponse[]): RecentComment[] {
    return items.slice(0, limit).map((item) => ({
      avatar: item.avatar,
      content: item.commentText?.trim() || plainText(item.comment || "") || "[空评论]",
      created: item.created,
      id: item.id,
      nick: item.nick?.trim() || "匿名访客",
      href: normalizeHref(item.url, item.id),
    }));
  }

  function formatDate(value: string | number): string {
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return "";
    const seconds = Math.round((date.valueOf() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });
    if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
    const minutes = Math.round(seconds / 60);
    if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 30) return formatter.format(days, "day");
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
  }

  function dateTime(value: string | number): string | undefined {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
  }

  async function load() {
    controller?.abort();
    status = "loading";
    controller = new AbortController();
    try {
      const response = await fetch(envId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "GET_RECENT_COMMENTS", includeReply, pageSize: limit }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const data = Array.isArray(payload) ? payload : payload?.data;
      if (!Array.isArray(data)) throw new Error("Invalid recent comments response");
      comments = normalize(data);
      status = comments.length ? "ready" : "empty";
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.error("[RecentComments] 加载失败：", error);
      comments = [];
      status = "error";
    }
  }

  onMount(() => {
    load();
    return () => controller?.abort();
  });
</script>

<section class="recent-comments" aria-labelledby="recent-comments-title" aria-busy={status === "loading"}>
  <header>
    <span class="icon-[fa7-solid--comments]" aria-hidden="true"></span>
    <h2 id="recent-comments-title">最新评论</h2>
  </header>

  {#if status === "loading"}
    <p class="recent-comments__state">正在读取评论…</p>
  {:else if status === "empty"}
    <p class="recent-comments__state">暂时还没有评论</p>
  {:else if status === "error"}
    <div class="recent-comments__state">
      <span>评论暂时不可用</span>
      <button type="button" onclick={load}>重试</button>
    </div>
  {:else}
    <ul>
      {#each comments as comment}
        <li>
          <a href={comment.href} aria-label={comment.href ? `查看 ${comment.nick} 的评论` : undefined}>
            <span class="recent-comments__avatar" aria-hidden="true">
              <span class="icon-[fa7-solid--user] recent-comments__avatar-fallback"></span>
              {#if comment.avatar}
                <img src={comment.avatar} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror={(event) => event.currentTarget.remove()} />
              {/if}
            </span>
            <span class="recent-comments__body">
              <span class="recent-comments__meta">
                <strong>{comment.nick}</strong>
                <time datetime={dateTime(comment.created)}>{formatDate(comment.created)}</time>
              </span>
              <span class="recent-comments__content">{comment.content}</span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .recent-comments {
    padding: var(--space-4);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    background: var(--surface-1);
    box-shadow: var(--shadow-sm);
  }

  header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    color: var(--accent);
  }

  header > span { width: 16px; height: 16px; }

  h2 {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--foreground);
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li a {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-md);
    color: inherit;
    text-decoration: none;
    transition: background var(--duration-fast) var(--ease-material);
  }

  li a:hover { background: var(--accent-subtle); }

  li a:not([href]) { cursor: default; }

  li a:not([href]):hover { background: transparent; }

  .recent-comments__avatar {
    position: relative;
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    border-radius: 50%;
    background: var(--surface-2);
    color: var(--foreground-muted);
  }

  .recent-comments__avatar img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .recent-comments__avatar-fallback { width: 14px; height: 14px; }

  .recent-comments__body {
    min-width: 0;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
  }

  .recent-comments__meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .recent-comments__meta strong {
    overflow: hidden;
    font-size: var(--text-xs);
    color: var(--foreground);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recent-comments__meta time {
    flex-shrink: 0;
    font-size: 0.6875rem;
    color: var(--foreground-muted);
  }

  .recent-comments__content {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-size: var(--text-xs);
    line-height: 1.45;
    color: var(--foreground-secondary);
    overflow-wrap: anywhere;
  }

  .recent-comments__state {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    min-height: 3rem;
    margin: 0;
    color: var(--foreground-muted);
    font-size: var(--text-xs);
  }

  .recent-comments__state button {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    color: var(--accent);
    background: var(--accent-subtle);
    cursor: pointer;
  }
</style>
