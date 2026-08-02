import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { siteConfig } from '../config/site';
import { getPostUrl } from '@/utils/abbrlink';

export async function GET(context) {
	const posts = (await getCollection('blog'))
		.filter((p) => !p.data.draft)
		.filter((p) => !p.data.password)
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

	// 显式映射字段，不展开 post.data：
	// rss 的 schema 要的是 pubDate 而非 date，展开会让日期被静默丢弃；
	// 同时避免把 password 等 frontmatter 私有字段送进外部输出。
	const response = rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: context.site,
		stylesheet: '/rss.xsl',
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.date,
			categories: post.data.tags,
			author: post.data.author,
			link: getPostUrl(post),
		})),
	});
	// 改 Content-Type 为 application/xml：application/rss+xml 下浏览器不应用
	// rss.xsl 美化（Chrome 对 feed MIME 忽略 xml-stylesheet）。
	// 静态生成环境 rss() 的 response.headers 可能为空，重建 Headers
	const headers = new Headers(response.headers);
	headers.set("Content-Type", "application/xml; charset=utf-8");
	return new Response(response.body, { status: response.status, headers });
}
