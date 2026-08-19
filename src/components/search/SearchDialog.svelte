<script lang="ts">
  import { onMount } from "svelte";
  import { loadPagefind } from "../../utils/pagefind";

  let { pagefindUrl }: { pagefindUrl: string } = $props();
  let dialog: HTMLDialogElement;
  let input: HTMLInputElement;
  let query = $state("");
  let results = $state<Array<{ url: string; title: string; excerpt: string }>>([]);
  let status = $state<"idle" | "loading" | "ready" | "empty" | "error">("idle");
  let activeIndex = $state(0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pagefind: any;

  function plainText(value: string): string {
    const document = new DOMParser().parseFromString(value, "text/html");
    return document.body.textContent?.trim() || "";
  }

  async function ensurePagefind() {
    if (pagefind) return pagefind;
    pagefind = await loadPagefind(pagefindUrl);
    await pagefind.init?.();
    return pagefind;
  }

  async function search() {
    const value = query.trim();
    if (!value) {
      results = [];
      status = "idle";
      return;
    }
    status = "loading";
    try {
      const api = await ensurePagefind();
      const response = await api.search(value);
      const data = await Promise.all(response.results.slice(0, 10).map((result: any) => result.data()));
      results = data.map((item: any) => ({
        url: item.url,
        title: item.meta?.title || item.url,
        excerpt: plainText(item.excerpt || item.content || ""),
      }));
      activeIndex = 0;
      status = results.length ? "ready" : "empty";
    } catch (error) {
      console.error("[Search] Pagefind 加载失败：", error);
      results = [];
      status = "error";
    }
  }

  function queueSearch() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(search, 140);
  }

  function open() {
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => input?.focus());
  }

  function close() {
    dialog.close();
  }

  function handleKeys(event: KeyboardEvent) {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % results.length;
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + results.length) % results.length;
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      location.assign(results[activeIndex].url);
      close();
    }
  }

  onMount(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => {
      document.removeEventListener("keydown", shortcut);
      if (timer) clearTimeout(timer);
    };
  });
</script>

<button class="search-trigger" type="button" aria-label="搜索文章（Ctrl+K）" onclick={open}>
  <span class="icon-[fa7-solid--magnifying-glass]" aria-hidden="true"></span>
</button>

<dialog bind:this={dialog} class="search-dialog" aria-labelledby="search-title" onclose={() => { query = ""; results = []; status = "idle"; }}>
  <div class="search-dialog__panel">
    <header class="search-dialog__header">
      <h2 id="search-title">全文搜索</h2>
      <button type="button" class="search-dialog__close" aria-label="关闭搜索" onclick={close}>
        <span class="icon-[fa7-solid--xmark]" aria-hidden="true"></span>
      </button>
    </header>
    <label class="search-dialog__field">
      <span class="icon-[fa7-solid--magnifying-glass]" aria-hidden="true"></span>
      <input bind:this={input} bind:value={query} oninput={queueSearch} onkeydown={handleKeys} placeholder="搜索标题、分类、标签和正文" autocomplete="off" />
      <kbd>Esc</kbd>
    </label>
    <div class="search-dialog__body" aria-live="polite" aria-busy={status === "loading"}>
      {#if status === "idle"}<p class="search-dialog__hint">输入关键词开始搜索</p>{/if}
      {#if status === "loading"}<p class="search-dialog__hint">正在搜索……</p>{/if}
      {#if status === "empty"}<p class="search-dialog__hint">没有找到匹配文章</p>{/if}
      {#if status === "error"}<p class="search-dialog__hint">搜索索引暂时不可用，请在生产构建后重试。</p>{/if}
      {#if status === "ready"}
        <ul class="search-results" role="listbox" aria-label="搜索结果">
          {#each results as result, index}
            <li>
              <a class:active={index === activeIndex} href={result.url} role="option" aria-selected={index === activeIndex} onmouseenter={() => activeIndex = index}>
                <strong>{result.title}</strong>
                <span>{result.excerpt}</span>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</dialog>

<svelte:window onkeydown={(event) => { if (event.key === "Escape" && dialog?.open) close(); }} />

<style>
  .search-trigger, .search-dialog__close { display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: var(--radius-full); color: var(--foreground-secondary); cursor: pointer; }
  .search-trigger:hover, .search-dialog__close:hover { color: var(--foreground); background: var(--accent-subtle); }
  .search-trigger span { width: 17px; height: 17px; }
  .search-dialog { position: fixed; inset: 0; width: min(680px, calc(100vw - 2rem)); max-height: min(78dvh, 720px); margin: auto; padding: 0; border: 0; color: var(--foreground); background: transparent; overflow: visible; }
  .search-dialog::backdrop { background: oklch(0 0 0 / .48); backdrop-filter: blur(8px); }
  .search-dialog__panel { overflow: hidden; border: 1px solid var(--glass-border); border-radius: var(--radius-xl); background: color-mix(in oklab, var(--surface-1) 88%, transparent); backdrop-filter: blur(calc(var(--glass-blur) * 1.4)); box-shadow: var(--shadow-xl), var(--glass-highlight); }
  .search-dialog__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5) var(--space-2); }
  .search-dialog__header h2 { margin: 0; font-size: var(--text-md); }
  .search-dialog__field { display: flex; align-items: center; gap: var(--space-3); margin: var(--space-3) var(--space-5); padding: 0 var(--space-4); min-height: 48px; border: 1px solid var(--glass-border); border-radius: var(--radius-lg); background: var(--glass-bg); }
  .search-dialog__field > span { width: 17px; height: 17px; color: var(--foreground-muted); }
  .search-dialog__field input { flex: 1; min-width: 0; border: 0; outline: 0; color: var(--foreground); background: transparent; font: inherit; }
  .search-dialog__field kbd { padding: 2px 6px; color: var(--foreground-muted); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: var(--text-xs); }
  .search-dialog__body { min-height: 180px; max-height: 55dvh; padding: var(--space-2) var(--space-3) var(--space-4); overflow-y: auto; }
  .search-dialog__hint { margin: var(--space-10) 0; text-align: center; color: var(--foreground-muted); }
  .search-results { display: grid; gap: var(--space-1); margin: 0; padding: 0; list-style: none; }
  .search-results a { display: grid; gap: var(--space-1); padding: var(--space-3); border-radius: var(--radius-md); color: var(--foreground-secondary); text-decoration: none; }
  .search-results a:hover, .search-results a.active { color: var(--foreground); background: var(--accent-subtle); }
  .search-results strong { font-size: var(--text-sm); }
  .search-results span { overflow: hidden; color: var(--foreground-muted); font-size: var(--text-xs); text-overflow: ellipsis; white-space: nowrap; }
  @media (max-width: 520px) { .search-dialog__header, .search-dialog__field { margin-inline: var(--space-3); } .search-dialog__header { padding-inline: var(--space-3); } }
</style>
