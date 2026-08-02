import { getCollection, render } from "astro:content";
import { siteConfig } from "../config/site";
import { getPostUrl } from "@/utils/abbrlink";

/** Date → RFC 3339 (Atom 要求的日期格式) */
function toRFC3339(date) {
	return date.toISOString();
}

/** XML 特殊字符转义 */
function esc(s) {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export async function GET(context) {
	const site = context.site.href.replace(/\/$/, "");

	const posts = (await getCollection("blog"))
		.filter((p) => !p.data.draft)
		.filter((p) => !p.data.password)
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

	const entries = await Promise.all(
		posts.map(async (post) => {
			const link = `${site}${getPostUrl(post)}`;
			const updated = post.data.updated || post.data.date;

			// 渲染文章获取摘录
			const { remarkPluginFrontmatter } = await render(post);
			const excerpt = remarkPluginFrontmatter?.excerpt || post.data.description;

			const categories = post.data.tags
				.map((t) => `    <category term="${esc(t)}" />`)
				.join("\n");

			return `  <entry>
    <title type="html"><![CDATA[${post.data.title}]]></title>
    <link href="${esc(link)}" />
    <id>${esc(link)}</id>
    <published>${toRFC3339(post.data.date)}</published>
    <updated>${toRFC3339(updated)}</updated>
    <summary type="html"><![CDATA[${excerpt}]]></summary>
    <author><name>${esc(post.data.author || siteConfig.author)}</name></author>
${categories}
  </entry>`;
		}),
	);

	const xml = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="/atom.xsl"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(siteConfig.title)}</title>
  <subtitle>${esc(siteConfig.description)}</subtitle>
  <link href="${esc(site)}/atom.xml" rel="self" type="application/atom+xml" />
  <link href="${esc(site)}/" rel="alternate" type="text/html" />
  <id>${esc(site)}/</id>
  <updated>${posts.length > 0 ? toRFC3339(posts[0].data.updated || posts[0].data.date) : toRFC3339(new Date())}</updated>
  <generator uri="https://astro.build" version="7.x">Astro</generator>
${entries.join("\n")}
</feed>`;

	return new Response(xml, {
		headers: {
			// application/atom+xml 下浏览器不应用 atom.xsl 美化（Chrome 对 feed MIME
			// 忽略 xml-stylesheet），改 application/xml 让订阅页在浏览器中渲染样式
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
}
