/** 仅处理明确标记的头像；先移除标记，兜底失败也不会循环请求。 */
function useFallback(image: HTMLImageElement) {
  const fallback = image.dataset.avatarFallback;
  if (!fallback) return;
  delete image.dataset.avatarFallback;
  image.src = fallback;
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
