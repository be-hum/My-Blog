import { Fragment } from 'react';
import Link from 'next/link';
import { getBlocks, getPageFromSlug } from '../../../lib/notion';
import Text from '../../../components/text';
import { renderBlock } from '../../../components/notion/renderer';
import styles from '../../../styles/post.module.css';

export const revalidate = 43200; // 12 hours

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const slug = decodeURIComponent(params?.slug ?? '');
  const page = await getPageFromSlug(slug);
  if (!page?.id) return { title: '글을 찾을 수 없습니다' };

  const title = page.properties?.title?.title?.[0]?.plain_text ?? '학습일지';
  const summary = page.properties?.summary?.rich_text?.[0]?.plain_text ?? '';
  const tags = page.properties?.tags?.multi_select?.map((t) => t.name) ?? [];
  const date = page.properties?.date?.date?.start;

  return {
    title,
    description: summary,
    keywords: tags,
    openGraph: {
      title,
      description: summary,
      type: 'article',
      publishedTime: date,
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: summary,
    },
  };
}

export default async function Page({ params }) {
  const slug = decodeURIComponent(params?.slug ?? '');
  const page = await getPageFromSlug(slug);
  if (!page?.id) return <div />;
  const blocks = await getBlocks(page.id);
  if (!blocks) return <div />;

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
