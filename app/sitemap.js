import { getDatabase, getPageBySlugAnyType } from '../lib/notion';
import { SITE_URL } from '../lib/site';

export const revalidate = 3600; // 1 hour — new posts reach crawlers quickly

export default async function sitemap() {
  const database = await getDatabase();

  const posts = database
    .map((post) => ({
      slug: post.properties?.slug?.rich_text?.[0]?.plain_text,
      lastModified: post.last_edited_time,
    }))
    .filter((post) => post.slug)
    .map((post) => ({
      url: `${SITE_URL}/article/${encodeURIComponent(post.slug)}`,
      lastModified: post.lastModified,
    }));

  let aboutModified;
  try {
    const about = await getPageBySlugAnyType('about');
    aboutModified = about?.last_edited_time;
  } catch (e) {
    aboutModified = undefined;
  }

  return [
    { url: SITE_URL, lastModified: database[0]?.last_edited_time ?? new Date() },
    { url: `${SITE_URL}/about`, lastModified: aboutModified ?? new Date() },
    ...posts,
  ];
}
