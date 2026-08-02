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
	// rss() 是 async，返回 Promise —— 必须 await 拿到真正的 Response，
	// 否则 response.headers/body 都是 undefined，重建出空 body 导致文件不落盘
	const response = await rss({
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
	// 静态生成下不能重包 response.body（流）——Astro 读到空 body 就不落盘
	// （"file not created, response body was empty"）。先取文本再以字符串 body
	// 重建，与 atom.xml.js 的写法一致。
	const body = await response.text();
	const headers = new Headers(response.headers);
	headers.set("Content-Type", "application/xml; charset=utf-8");
	return new Response(body, { status: response.status, headers });
}
