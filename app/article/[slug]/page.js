import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlocks, getDatabase, getPageFromSlug } from '../../../lib/notion';
import Text from '../../../components/text';
import { renderBlock } from '../../../components/notion/renderer';
import styles from '../../../styles/post.module.css';
import {
  OG_IMAGE, SITE_NAME, buildOpenGraph,
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

  return (
    <article className={styles.container}>
      <h1 className={styles.name}>
        <Text title={page.properties?.title?.title} />
      </h1>
      <section>
        {blocks.map((block) => (
          <Fragment key={block.id}>{renderBlock(block)}</Fragment>
        ))}
        <Link href="/" className={styles.back}>
          ← 목록으로
        </Link>
      </section>
    </article>
  );
}
