import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { siteConfig } from '../config/site';

export async function GET(context) {
	const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.id}/`,
		})),
	});
}
