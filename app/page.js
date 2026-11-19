import Link from 'next/link';
import { getDatabase } from '../lib/notion';
import styles from './index.module.css';
import ThemeToggle from '../components/theme-toggle';
import PostList from '../components/post-list';
import {
  SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, buildOpenGraph,
} from '../lib/site';

export const databaseId = process.env?.NOTION_DATABASE_ID ?? 'NOTION_DATABASE_ID';

// 12 hours — Notion content changes rarely, and ISR serves the cached page
// instantly while regenerating in the background.
export const revalidate = 43200;

export const metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': [{ url: '/rss.xml', title: SITE_NAME }] },
  },
  openGraph: buildOpenGraph({ url: '/', title: SITE_TITLE }),
};

export default async function Page() {
  const database = await getDatabase();

  const posts = database.map((post) => ({
    id: post.id,
    title: post.properties?.title?.title?.[0]?.plain_text ?? '(제목 없음)',
    slug: post.properties?.slug?.rich_text?.[0]?.plain_text ?? '',
    summary: post.properties?.summary?.rich_text?.[0]?.plain_text ?? '',
    tags: post.properties?.tags?.multi_select?.map((t) => t.name) ?? [],
    category: post.properties?.category?.select?.name ?? '',
    // Listed and sorted by last edit, so recently updated posts surface first.
    date: post.last_edited_time,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'ko-KR',
  };

  return (
    <div>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={styles.container}>
        <header className={styles.header}>
          <nav className={styles.nav}>
            <Link href="/about" className={styles.navLink}>About</Link>
            <ThemeToggle />
          </nav>
          <h1>{SITE_NAME}</h1>
          <p>
            컴퓨터와 정보보안을 공부하며 정리한 학습 노트입니다.
            HackTheBox 모의해킹 풀이, 버퍼 오버플로·힙 같은 시스템 해킹 기초,
            CVE·MITRE ATT&amp;CK·위협 인텔리전스 개념, 보안 보고서 리뷰,
            AI 에이전트·프롬프트 엔지니어링 정리를 다룹니다.
          </p>
        </header>

        <PostList posts={posts} />
      </main>
    </div>
  );
}
