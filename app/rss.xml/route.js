import { getDatabase } from '../../lib/notion';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../../lib/site';

export const revalidate = 3600; // 1 hour

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const database = await getDatabase();

  const items = database
    .map((post) => ({
      title: post.properties?.title?.title?.[0]?.plain_text ?? '',
      slug: post.properties?.slug?.rich_text?.[0]?.plain_text,
      summary: post.properties?.summary?.rich_text?.[0]?.plain_text ?? '',
      tags: post.properties?.tags?.multi_select?.map((t) => t.name) ?? [],
      pubDate: new Date(post.properties?.date?.date?.start ?? post.created_time),
    }))
    .filter((post) => post.slug)
    .map((post) => {
      const link = `${SITE_URL}/article/${encodeURIComponent(post.slug)}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.summary)}</description>
      <pubDate>${post.pubDate.toUTCString()}</pubDate>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join('\n')}
    </item>`;
    });

  const lastBuildDate = new Date(database[0]?.last_edited_time ?? Date.now()).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
