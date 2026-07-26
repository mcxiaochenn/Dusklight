import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { siteConfig } from '../config/site';
import { getPostUrl } from '@/utils/abbrlink';

export async function GET(context) {
	const posts = (await getCollection('blog'))
		.filter((p) => !p.data.draft)
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

	// 显式映射字段，不展开 post.data：
	// rss 的 schema 要的是 pubDate 而非 date，展开会让日期被静默丢弃；
	// 同时避免把 password 等 frontmatter 私有字段送进外部输出。
	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.date,
			categories: post.data.tags,
			author: post.data.author,
			link: getPostUrl(post),
		})),
	});
}
