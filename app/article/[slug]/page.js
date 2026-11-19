import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlocks, getDatabase, getPageFromSlug } from '../../../lib/notion';
import Text from '../../../components/text';
import { renderBlock } from '../../../components/notion/renderer';
import styles from '../../../styles/post.module.css';
import {
  OG_IMAGE, SITE_NAME, SITE_URL, buildOpenGraph,
} from '../../../lib/site';

export const revalidate = 43200; // 12 hours

// Pre-render every public post at build time. Without this each article is
// rendered on first request, so a burst of visits/prefetches fans out into
// many serverless instances that all hit the Notion API at once (429).
export async function generateStaticParams() {
  const database = await getDatabase();
  return database
    .map((post) => post.properties?.slug?.rich_text?.[0]?.plain_text)
    .filter(Boolean)
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const slug = decodeURIComponent(params?.slug ?? '');
  const page = await getPageFromSlug(slug);
  if (!page?.id) notFound();

  const title = page.properties?.title?.title?.[0]?.plain_text ?? '학습일지';
  const summary = page.properties?.summary?.rich_text?.[0]?.plain_text ?? '';
  const description = summary || `${title} - ${SITE_NAME}`;
  const tags = page.properties?.tags?.multi_select?.map((t) => t.name) ?? [];
  const keywords = tags
    .map((t) => t.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').trim())
    .filter(Boolean);
  const date = page.properties?.date?.date?.start;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/article/${slug}` },
    openGraph: buildOpenGraph({
      title,
      description,
      type: 'article',
      url: `/article/${slug}`,
      publishedTime: date,
      modifiedTime: page.last_edited_time,
      tags,
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export default async function Page({ params }) {
  const slug = decodeURIComponent(params?.slug ?? '');
  const page = await getPageFromSlug(slug);
  if (!page?.id) notFound();
  const blocks = await getBlocks(page.id);
  if (!blocks) notFound();

  const title = page.properties?.title?.title?.[0]?.plain_text ?? '학습일지';
  const summary = page.properties?.summary?.rich_text?.[0]?.plain_text ?? '';
  const tags = page.properties?.tags?.multi_select?.map((t) => t.name) ?? [];
  const category = page.properties?.category?.select?.name ?? '';

  // Related posts: most shared tags first, then same category.
  const related = (await getDatabase())
    .filter((p) => p.id !== page.id)
    .map((p) => {
      const pTags = p.properties?.tags?.multi_select?.map((t) => t.name) ?? [];
      const shared = pTags.filter((t) => tags.includes(t)).length;
      const sameCategory = category && p.properties?.category?.select?.name === category ? 1 : 0;
      return {
        slug: p.properties?.slug?.rich_text?.[0]?.plain_text,
        title: p.properties?.title?.title?.[0]?.plain_text,
        score: shared * 2 + sameCategory,
      };
    })
    .filter((p) => p.slug && p.title && p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: summary || undefined,
    inLanguage: 'ko-KR',
    datePublished: page.properties?.date?.date?.start,
    dateModified: page.last_edited_time,
    mainEntityOfPage: `${SITE_URL}/article/${slug}`,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };

  return (
    <article className={styles.container}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <h1 className={styles.name}>
        <Text title={page.properties?.title?.title} />
      </h1>
      <section>
        {blocks.map((block) => (
          <Fragment key={block.id}>{renderBlock(block)}</Fragment>
        ))}
        {related.length > 0 && (
          <nav className={styles.related} aria-label="관련 글">
            <h2 className={styles.relatedTitle}>관련 글</h2>
            <ul>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/article/${r.slug}`} prefetch={false}>{r.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <Link href="/" className={styles.back}>
          ← 목록으로
        </Link>
      </section>
    </article>
  );
}
