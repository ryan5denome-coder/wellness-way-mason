import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../lib/site';
import { clinic } from '../lib/site';

export async function GET(context) {
  const posts = await getCollection('posts');
  const sorted = posts
    .filter((p) => p.data.date)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: `${clinic.brandName} — Blog`,
    description:
      'Articles on chiropractic care, hormone health, gut health, thyroid testing, and the test-don\'t-guess approach to feeling better.',
    site: context.site ?? site.url,
    items: sorted.map((post) => ({
      title: post.data.title.trim(),
      pubDate: post.data.date,
      description: post.data.excerpt ?? post.data.seoDescription ?? '',
      link: `/post/${post.id.replace(/\.md$/, '')}/`,
      author: post.data.author,
      categories: post.data.categories,
    })),
    customData: `<language>en-us</language>`,
  });
}
