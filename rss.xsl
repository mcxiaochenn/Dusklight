<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html" encoding="utf-8" indent="yes" />

<xsl:template match="/">
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title><xsl:value-of select="rss/channel/title" /> - RSS</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --hue:170;
  --bg:oklch(0.98 0.005 var(--hue));
  --surface-0:oklch(0.97 0.006 var(--hue));
  --surface-1:oklch(0.94 0.008 var(--hue));
  --text:oklch(0.25 0.02 var(--hue));
  --text-secondary:oklch(0.45 0.015 var(--hue));
  --text-muted:oklch(0.60 0.01 var(--hue));
  --accent:oklch(0.60 0.15 var(--hue));
  --accent-dim:oklch(0.55 0.12 var(--hue));
  --border:oklch(0.88 0.01 var(--hue));
  --radius:16px;--radius-sm:10px;
}
@media(prefers-color-scheme:dark){:root{
  --bg:oklch(0.17 0.015 var(--hue));
  --surface-0:oklch(0.20 0.018 var(--hue));
  --surface-1:oklch(0.25 0.02 var(--hue));
  --text:oklch(0.90 0.01 var(--hue));
  --text-secondary:oklch(0.72 0.015 var(--hue));
  --text-muted:oklch(0.55 0.01 var(--hue));
  --accent:oklch(0.75 0.14 var(--hue));
  --accent-dim:oklch(0.65 0.10 var(--hue));
  --border:oklch(0.30 0.015 var(--hue));
}}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;padding:0 1.5rem}
a{color:var(--accent);text-decoration:none;transition:color .2s}
a:hover{color:var(--accent-dim);text-decoration:underline}
.container{max-width:720px;margin:0 auto;padding:3rem 0 2.5rem}
.hero{text-align:center;padding:2.5rem 2rem;margin-bottom:2rem;background:var(--surface-0);border:1px solid var(--border);border-radius:var(--radius)}
.hero__icon{font-size:3rem;margin-bottom:.75rem}
.hero__title{font-size:1.5rem;font-weight:700;letter-spacing:-.01em;margin-bottom:.375rem}
.hero__desc{color:var(--text-secondary);font-size:.9rem;line-height:1.6}
.hero__badge{display:inline-block;margin-top:1rem;padding:.35rem 1rem;background:oklch(0.92 0.04 var(--hue));color:var(--accent);border-radius:999px;font-size:.8rem;font-weight:500}
@media(prefers-color-scheme:dark){.hero__badge{background:oklch(0.30 0.05 var(--hue))}}
.list{display:flex;flex-direction:column;gap:1rem}
.item{padding:1.25rem 1.5rem;background:var(--surface-0);border:1px solid var(--border);border-radius:var(--radius-sm);transition:border-color .2s}
.item:hover{border-color:var(--accent-dim)}
.item__title{font-size:1.05rem;font-weight:600;margin-bottom:.4rem;line-height:1.5}
.item__date{font-size:.8rem;color:var(--text-muted);margin-bottom:.6rem;font-variant-numeric:tabular-nums}
.item__desc{color:var(--text-secondary);font-size:.875rem;line-height:1.75}
.footer{text-align:center;padding:2rem 0 1.5rem;color:var(--text-muted);font-size:.78rem;border-top:1px solid var(--border);margin-top:2rem}
.footer__dot{margin:0 .45em}
</style>
</head>
<body>
<div class="container">
  <div class="hero">
    <div class="hero__icon">📡</div>
    <h1 class="hero__title"><xsl:value-of select="rss/channel/title" /></h1>
    <p class="hero__desc"><xsl:value-of select="rss/channel/description" /></p>
    <span class="hero__badge">RSS 2.0 订阅源</span>
  </div>
  <div class="list">
    <xsl:for-each select="rss/channel/item">
    <article class="item">
      <h2 class="item__title"><a href="{link}"><xsl:value-of select="title" /></a></h2>
      <time class="item__date"><xsl:value-of select="pubDate" /></time>
      <p class="item__desc"><xsl:value-of select="description" /></p>
    </article>
    </xsl:for-each>
  </div>
  <footer class="footer">
    <xsl:value-of select="rss/channel/title" /><xsl:value-of select="' '" />
    <span class="footer__dot">&#xB7;</span><xsl:value-of select="' '" />
    <xsl:value-of select="count(rss/channel/item)" /> 篇文章
  </footer>
</div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
