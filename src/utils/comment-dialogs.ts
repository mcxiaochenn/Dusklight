/**
 * 针对 Artalk 2.10.0 的 layers manager 方法形状与 layer 命名（login / checker-*）验证。
 * 升级 Artalk 时需回归：manager.create 猴补丁、checker-* 名称匹配、取消按钮的 data-action。
 */
import type { ArtalkPlugin, Layer } from "artalk";

type OpenLayer = { layer: Layer; opener: HTMLElement | null };
let stack: OpenLayer[] = [];
const inertBefore = new Map<HTMLElement, boolean>();

function controls(el: HTMLElement) {
  return [...el.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]")]
    .filter((node) => node.tabIndex >= 0 && !node.matches(":disabled") &&
      !node.closest("[inert]") && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== "hidden");
}

function restoreBackground() {
  inertBefore.forEach((inert, node) => { node.inert = inert; });
  inertBefore.clear();
}

function activateTop() {
  restoreBackground();
  const top = stack.at(-1)?.layer.getEl();
  if (!top) return;
  // 只隔离弹窗祖先路径之外的兄弟节点，保留原有 inert 状态。
  let path: HTMLElement = top;
  while (path.parentElement) {
    for (const sibling of path.parentElement.children) {
      if (sibling instanceof HTMLElement && sibling !== path && !sibling.classList.contains("atk-layer-mask")) {
        inertBefore.set(sibling, sibling.inert);
        sibling.inert = true;
      }
    }
    if (path.parentElement === document.body) break;
    path = path.parentElement;
  }
  if (!top.contains(document.activeElement)) (controls(top)[0] ?? top).focus();
}

// 常驻监听器仅注册一次，每次读取当前实例的弹窗栈。
document.addEventListener("keydown", (event) => {
  const layer = stack.at(-1)?.layer;
  if (!layer || event.defaultPrevented) return;
  // Escape 语义独立于遮罩关闭策略：优先点原生取消/关闭，仅在允许遮罩关闭时才裸 hide。
  if (event.key === "Escape") {
    event.preventDefault();
    // 验证器的取消按钮还会结束待处理 Promise，不能只隐藏 DOM。
    const close = layer.getEl().querySelector<HTMLElement>('[data-action="cancel"], .atk-auth-dialog-title .atk-close');
    if (close) close.click();
    else if (layer.getAllowMaskClose()) layer.hide();
  } else if (event.key === "Tab") {
    const el = layer.getEl();
    const items = controls(el);
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (!items.length || index < 0 || (event.shiftKey ? index === 0 : index === items.length - 1)) {
      event.preventDefault();
      (event.shiftKey ? items.at(-1) ?? el : items[0] ?? el).focus();
    }
  }
});

document.addEventListener("focusin", () => {
  const top = stack.at(-1)?.layer.getEl();
  if (top && !top.contains(document.activeElement)) (controls(top)[0] ?? top).focus();
});

/** 固定版 Layer 只有显隐和遮罩关闭；通过公开插件接口补充焦点生命周期。 */
export const commentDialogs: ArtalkPlugin = (ctx) => {
  ctx.on("created", () => {
    const manager = ctx.inject("layers");
    const create = manager.create.bind(manager);
    manager.create = (name, element) => {
      const layer = create(name, element);
      // 只接管已核查的登录和验证码层，管理侧栏含独立 iframe。
      if (name !== "login" && !name.startsWith("checker-")) return layer;
      const el = layer.getEl();
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-label", name === "login" ? "账户登录与注册" : "评论验证");
      el.tabIndex = -1;
      const show = layer.show.bind(layer);
      const hide = layer.hide.bind(layer);
      const destroy = layer.destroy.bind(layer);
      const close = (nativeClose: () => void) => {
        const index = stack.findIndex((entry) => entry.layer === layer);
        const wasTop = index === stack.length - 1;
        const entry = index >= 0 ? stack.splice(index, 1)[0] : undefined;
        nativeClose();
        activateTop();
        if (wasTop && entry?.opener?.isConnected && !entry.opener.closest("[inert]")) entry.opener.focus();
      };
      layer.show = () => {
        if (!stack.some((entry) => entry.layer === layer)) {
          stack.push({ layer, opener: document.activeElement instanceof HTMLElement ? document.activeElement : null });
        }
        show();
        activateTop();
      };
      layer.hide = () => close(hide);
      layer.destroy = () => close(destroy);
      return layer;
    };
    // 注册/重置切换会替换内部 DOM，焦点所在控件消失后重新定位。
    const observer = new MutationObserver(() => {
      const top = stack.at(-1)?.layer.getEl();
      if (top && (!top.contains(document.activeElement) || document.activeElement === top)) {
        (controls(top)[0] ?? top).focus();
      }
    });
    observer.observe(manager.getEl(), { childList: true, subtree: true });
    ctx.on("unmounted", () => {
      observer.disconnect();
      stack = [];
      restoreBackground();
    });
  });
};
