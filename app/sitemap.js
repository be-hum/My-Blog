import { getDatabase } from '../lib/notion';

export const revalidate = 43200; // 12 hours

export default async function sitemap() {
  const base = 'https://computudy-note.vercel.app';
  const database = await getDatabase();

  const posts = database.map((post) => ({
    url: `${base}/article/${post.properties?.slug?.rich_text?.[0]?.plain_text}`,
    lastModified: post.last_edited_time,
  }));

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    ...posts,
  ];
}
