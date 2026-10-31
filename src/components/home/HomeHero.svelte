<script lang="ts">
  import { onMount } from "svelte";

  export interface HeroPost {
    title: string;
    url: string;
    cover: string;
    fullBleed: boolean;
  }

  let { posts }: { posts: HeroPost[] } = $props();
  let viewport: HTMLDivElement;
  let activeIndex = $state(0);
  let paused = $state(false);
  let reducedMotion = $state(false);
  let scrollFrame: number | undefined;

  function show(index: number, behavior: ScrollBehavior = "smooth") {
    if (!posts.length) return;
    activeIndex = (index + posts.length) % posts.length;
    viewport?.scrollTo({
      left: viewport.clientWidth * activeIndex,
      behavior: reducedMotion ? "auto" : behavior,
    });
  }

  function syncActiveSlide() {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (!viewport?.clientWidth) return;
      activeIndex = Math.max(0, Math.min(posts.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
    });
  }

  function handleKeys(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      show(activeIndex + 1);
    }
  }

  onMount(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => reducedMotion = media.matches;
    syncMotion();
    media.addEventListener("change", syncMotion);

    const timer = window.setInterval(() => {
      if (!paused && !reducedMotion && posts.length > 1 && document.visibilityState === "visible") {
        show(activeIndex + 1);
      }
    }, 6000);

    return () => {
      window.clearInterval(timer);
      media.removeEventListener("change", syncMotion);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
    };
  });
</script>

{#if posts.length}
  <section
    class="home-hero"
    aria-label="推荐文章"
    role="region"
    tabindex="0"
    onpointerenter={() => paused = true}
    onpointerleave={() => paused = false}
    onfocusin={() => paused = true}
    onfocusout={() => paused = false}
    onkeydown={handleKeys}
  >
    <div class="home-hero__viewport" bind:this={viewport} onscroll={syncActiveSlide}>
      {#each posts as post, index}
        <a
          class="home-hero__slide"
          href={post.url}
          aria-label={post.title}
          aria-hidden={index !== activeIndex ? "true" : undefined}
          tabindex={index === activeIndex ? undefined : -1}
        >
          <div class:home-hero__media--full={post.fullBleed} class="home-hero__media">
            <img
              src={post.cover}
              alt=""
              loading={index === 0 ? "eager" : "lazy"}
              fetchpriority={index === 0 ? "high" : "auto"}
              decoding="async"
            />
          </div>
          <div class="home-hero__scrim"></div>
          <div class="home-hero__content">
            <span class="home-hero__eyebrow">
              <span class="icon-[fa7-solid--star]" aria-hidden="true"></span>
              全站推荐
            </span>
            <h2>{post.title}</h2>
          </div>
        </a>
      {/each}
    </div>

    {#if posts.length > 1}
      <div class="home-hero__controls" aria-label="推荐文章切换">
        <div class="home-hero__indicators">
          {#each posts as post, index}
            <button
              type="button"
              class:active={index === activeIndex}
              aria-label={`查看推荐文章：${post.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onclick={() => show(index)}
            ></button>
          {/each}
        </div>
        <div class="home-hero__arrows">
          <button type="button" aria-label="上一篇推荐" onclick={() => show(activeIndex - 1)}>
            <span class="icon-[fa7-solid--chevron-left]" aria-hidden="true"></span>
          </button>
          <button type="button" aria-label="下一篇推荐" onclick={() => show(activeIndex + 1)}>
            <span class="icon-[fa7-solid--chevron-right]" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    {/if}
  </section>
{/if}

<style>
  .home-hero {
    position: relative;
    width: 100%;
    height: 320px;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    background: var(--surface-1);
    box-shadow: var(--shadow-md);
    outline: none;
  }

  .home-hero:focus-visible {
    box-shadow: 0 0 0 3px var(--accent-subtle), var(--shadow-md);
  }

  .home-hero__viewport {
    display: flex;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    overscroll-behavior-inline: contain;
  }

  .home-hero__viewport::-webkit-scrollbar { display: none; }

  .home-hero__slide {
    position: relative;
    flex: 0 0 100%;
    min-width: 0;
    height: 100%;
    overflow: hidden;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    color: oklch(0.98 0.006 var(--hue));
    text-decoration: none;
    background: var(--surface-2);
  }

  .home-hero__media {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: var(--space-6);
  }

  .home-hero__media img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .home-hero__media--full { padding: 0; }
  .home-hero__media--full img { object-fit: cover; }

  .home-hero__scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 32%, oklch(0.08 0.015 var(--hue) / 0.78) 100%);
    pointer-events: none;
  }

  .home-hero__content {
    position: absolute;
    left: var(--space-6);
    right: var(--space-6);
    bottom: var(--space-6);
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-right: 8rem;
  }

  .home-hero__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    width: fit-content;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: var(--tracking-loose);
  }

  .home-hero__eyebrow span { width: 13px; height: 13px; }

  .home-hero h2 {
    max-width: 46rem;
    margin: 0;
    font-size: var(--text-lg);
    line-height: 1.25;
    letter-spacing: var(--tracking-snug);
    text-wrap: balance;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .home-hero__controls {
    position: absolute;
    right: var(--space-5);
    bottom: var(--space-5);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .home-hero__indicators,
  .home-hero__arrows {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .home-hero__indicators button {
    width: 7px;
    height: 7px;
    padding: 0;
    border-radius: var(--radius-full);
    background: oklch(1 0 0 / 0.45);
    cursor: pointer;
    transition: width var(--duration-fast) var(--ease-material), background var(--duration-fast) var(--ease-material);
  }

  .home-hero__indicators button.active {
    width: 20px;
    background: oklch(1 0 0 / 0.92);
  }

  .home-hero__arrows button {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 1px solid oklch(1 0 0 / 0.2);
    border-radius: var(--radius-full);
    color: white;
    background: oklch(0.08 0.01 var(--hue) / 0.52);
    cursor: pointer;
    transition: background var(--duration-fast) var(--ease-material);
  }

  .home-hero__arrows button:hover { background: oklch(0.08 0.01 var(--hue) / 0.75); }
  .home-hero__arrows span { width: 13px; height: 13px; }

  @media (max-width: 768px) {
    .home-hero { height: 200px; border-radius: var(--radius-lg); }
    .home-hero__media { padding: var(--space-3); }
    .home-hero__media--full { padding: 0; }
    .home-hero__content {
      left: var(--space-4);
      right: var(--space-4);
      bottom: var(--space-4);
      padding-right: 0;
    }
    .home-hero h2 { font-size: var(--text-md); padding-right: 3rem; }
    .home-hero__controls { right: var(--space-3); bottom: var(--space-3); }
    .home-hero__arrows { display: none; }
    .home-hero__indicators button { width: 6px; height: 6px; }
    .home-hero__indicators button.active { width: 16px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .home-hero__viewport { scroll-behavior: auto; }
    .home-hero__indicators button { transition: none; }
  }
</style>
