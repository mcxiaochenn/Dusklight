<script lang="ts">
  import QRCode from "qrcode";

  let {
    title,
    description,
    date,
    cover,
    avatar,
    siteName,
    url,
  }: { title: string; description: string; date: string; cover?: string; avatar: string; siteName: string; url: string } = $props();

  let dialog: HTMLDialogElement;
  let canvas: HTMLCanvasElement;
  let generating = $state(false);
  let message = $state("");

  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.closePath();
  }

  function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
    const ratio = Math.max(width / image.width, height / image.height);
    const sourceWidth = width / ratio;
    const sourceHeight = height / ratio;
    const sourceX = (image.width - sourceWidth) / 2;
    const sourceY = (image.height - sourceHeight) / 2;
    context.save();
    roundedRect(context, x, y, width, height, 42);
    context.clip();
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    context.restore();
  }

  function wrapText(context: CanvasRenderingContext2D, value: string, x: number, y: number, width: number, lineHeight: number, maxLines: number) {
    const chars = [...value.trim()];
    const lines: string[] = [];
    let line = "";
    for (const char of chars) {
      const next = line + char;
      if (context.measureText(next).width > width && line) {
        lines.push(line);
        line = char;
        if (lines.length === maxLines) break;
      } else line = next;
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length === maxLines && chars.join("").length > lines.join("").length) {
      while (context.measureText(`${lines[maxLines - 1]}…`).width > width) lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
      lines[maxLines - 1] += "…";
    }
    lines.forEach((item, index) => context.fillText(item, x, y + index * lineHeight));
    return y + lines.length * lineHeight;
  }

  async function generate() {
    generating = true;
    message = "";
    dialog.showModal();
    try {
      await document.fonts?.load('700 58px "MiSans Subset"');
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      canvas.width = 1080;
      canvas.height = 1440;
      const dark = document.documentElement.classList.contains("dark");
      const foreground = dark ? "#eef5f3" : "#17211f";
      const muted = dark ? "#a4b4b0" : "#61706c";
      const surface = dark ? "#182421" : "#f1f8f6";
      const accent = dark ? "#56d8bd" : "#168c76";

      const gradient = context.createLinearGradient(0, 0, 1080, 1440);
      gradient.addColorStop(0, surface);
      gradient.addColorStop(1, dark ? "#0e1715" : "#dcece8");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 1080, 1440);

      let coverImage: HTMLImageElement | undefined;
      if (cover) {
        try { coverImage = await loadImage(cover); } catch { coverImage = undefined; }
      }
      if (coverImage) drawCover(context, coverImage, 70, 70, 940, 500);
      else {
        context.fillStyle = accent;
        roundedRect(context, 70, 70, 940, 500, 42);
        context.fill();
        context.fillStyle = "rgba(255,255,255,.88)";
        context.font = '700 92px "MiSans Subset", sans-serif';
        context.fillText(siteName, 120, 340, 840);
      }

      context.fillStyle = accent;
      context.font = '600 30px "MiSans Subset", sans-serif';
      context.fillText(date, 76, 640);
      context.fillStyle = foreground;
      context.font = '700 58px "MiSans Subset", sans-serif';
      let cursor = wrapText(context, title, 76, 720, 928, 76, 4) + 24;
      context.fillStyle = muted;
      context.font = '400 30px "MiSans Subset", sans-serif';
      wrapText(context, description, 76, cursor, 928, 46, 6);

      context.strokeStyle = dark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.1)";
      context.beginPath();
      context.moveTo(76, 1220);
      context.lineTo(1004, 1220);
      context.stroke();

      try {
        const avatarImage = await loadImage(avatar);
        context.save();
        context.beginPath();
        context.arc(122, 1310, 42, 0, Math.PI * 2);
        context.clip();
        context.drawImage(avatarImage, 80, 1268, 84, 84);
        context.restore();
      } catch {}
      context.fillStyle = foreground;
      context.font = '600 32px "MiSans Subset", sans-serif';
      context.fillText(siteName, 190, 1322, 500);

      const qrData = await QRCode.toDataURL(url, { width: 160, margin: 1, color: { dark: foreground, light: "#00000000" } });
      const qr = await loadImage(qrData);
      context.drawImage(qr, 840, 1240, 160, 160);
      message = "海报已生成";
    } catch (error) {
      console.error("[SharePoster] 生成失败：", error);
      message = "海报生成失败，请稍后重试";
    } finally {
      generating = false;
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      message = "链接已复制";
    } catch {
      const field = document.createElement("textarea");
      field.value = url;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
      message = "链接已复制";
    }
  }

  function download() {
    const link = document.createElement("a");
    link.download = `${title.replace(/[\\/:*?"<>|]/g, "-")}-分享海报.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
</script>

<div class="share-actions">
  <button type="button" onclick={copyLink}><span class="icon-[fa7-solid--link]" aria-hidden="true"></span>复制链接</button>
  <button type="button" onclick={generate} disabled={generating}><span class="icon-[fa7-solid--image]" aria-hidden="true"></span>{generating ? "生成中……" : "生成海报"}</button>
  <span class="share-actions__status" aria-live="polite">{message}</span>
</div>

<dialog bind:this={dialog} class="poster-dialog" aria-label="分享海报预览">
  <div class="poster-dialog__panel">
    <canvas bind:this={canvas} aria-label="文章分享海报"></canvas>
    <div class="poster-dialog__actions">
      <button type="button" onclick={download} disabled={generating}>下载 PNG</button>
      <button type="button" onclick={() => dialog.close()}>关闭</button>
    </div>
  </div>
</dialog>

<style>
  .share-actions { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); }
  .share-actions button, .poster-dialog button { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); min-height: 38px; padding: 0 var(--space-4); color: var(--foreground); background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--radius-md); cursor: pointer; }
  .share-actions button:hover, .poster-dialog button:hover { color: var(--accent); background: var(--accent-subtle); }
  .share-actions button span { width: 14px; height: 14px; }
  .share-actions__status { color: var(--foreground-muted); font-size: var(--text-xs); }
  .poster-dialog { width: min(520px, calc(100vw - 2rem)); max-height: 90dvh; padding: 0; border: 0; background: transparent; }
  .poster-dialog::backdrop { background: oklch(0 0 0 / .55); backdrop-filter: blur(8px); }
  .poster-dialog__panel { padding: var(--space-4); border: 1px solid var(--glass-border); border-radius: var(--radius-xl); background: var(--surface-1); box-shadow: var(--shadow-xl); }
  canvas { display: block; width: 100%; height: auto; max-height: 72dvh; object-fit: contain; border-radius: var(--radius-lg); }
  .poster-dialog__actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-3); }
</style>
