import Link from 'next/link';
import { getDatabase } from '../lib/notion';
import styles from './index.module.css';
import ThemeToggle from '../components/theme-toggle';
import PostList from '../components/post-list';

export const databaseId = process.env?.NOTION_DATABASE_ID ?? 'NOTION_DATABASE_ID';

// 12 hours — Notion content changes rarely, and ISR serves the cached page
// instantly while regenerating in the background.
export const revalidate = 43200;

export default async function Page() {
  const database = await getDatabase();

  const posts = database.map((post) => ({
    id: post.id,
    title: post.properties?.title?.title?.[0]?.plain_text ?? '(제목 없음)',
    slug: post.properties?.slug?.rich_text?.[0]?.plain_text ?? '',
    summary: post.properties?.summary?.rich_text?.[0]?.plain_text ?? '',
    tags: post.properties?.tags?.multi_select?.map((t) => t.name) ?? [],
    category: post.properties?.category?.select?.name ?? '',
    date: post.properties?.date?.date?.start ?? post.last_edited_time,
  }));

  return (
    <div>
      <main className={styles.container}>
        <header className={styles.header}>
          <nav className={styles.nav}>
            <Link href="/about" className={styles.navLink}>About</Link>
            <ThemeToggle />
          </nav>
          <h1>학습일지</h1>
          <p>정리된 학습 내용을 기록하는 블로그입니다.</p>
        </header>

        <PostList posts={posts} />
      </main>
    </div>
  );
}
