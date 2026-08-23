import { Fragment } from 'react';
import Link from 'next/link';
import { getPageBySlugAnyType, getBlocks } from '../../lib/notion';
import { renderBlock } from '../../components/notion/renderer';
import Text from '../../components/text';
import styles from '../../styles/post.module.css';

export const revalidate = 43200; // 12 hours

export default async function About() {
  const page = await getPageBySlugAnyType('about');
  if (!page) return <div>준비 중입니다.</div>;
  const blocks = await getBlocks(page.id);

  return (
    <article className={styles.container}>
      <Link href="/" className={styles.back}>
        ← 홈으로
      </Link>
      <h1 className={styles.name}>
        <Text title={page.properties.title?.title} />
      </h1>
      <section>
        {blocks.map((block) => (
          <Fragment key={block.id}>{renderBlock(block)}</Fragment>
        ))}
      </section>
    </article>
  );
}
