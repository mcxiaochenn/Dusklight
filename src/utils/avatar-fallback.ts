/**
 * 头像加载失败兜底：优先生成「名称首字 + 确定性柔和色块」SVG，
 * 缺省名称时退回 data-avatar-fallback 指定的静态占位图。
 * 先移除标记，确保兜底图本身失败也不会循环请求。
 */
function buildInitialsSvg(name: string): string {
  const initial = Array.from(name.trim())[0]?.toUpperCase() || "?";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  const safeInitial = initial
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" fill="hsl(${hue} 42% 46%)"/>` +
    `<text x="50%" y="52%" dominant-baseline="central" text-anchor="middle" ` +
    `fill="#fff" font-family="sans-serif" font-size="28" font-weight="600">${safeInitial}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function useFallback(image: HTMLImageElement) {
  const fallback = image.dataset.avatarFallback;
  if (!fallback) return;
  delete image.dataset.avatarFallback;
  const name = (image.dataset.avatarName || image.alt || "").trim();
  image.src = name ? buildInitialsSvg(name) : fallback;
}

document.addEventListener("error", (event) => {
  if (event.target instanceof HTMLImageElement) useFallback(event.target);
}, true);

function checkFailedAvatars() {
  document.querySelectorAll<HTMLImageElement>("img[data-avatar-fallback]").forEach((image) => {
    if (image.complete && image.naturalWidth === 0) useFallback(image);
  });
}

checkFailedAvatars();
document.addEventListener("astro:page-load", checkFailedAvatars);
