'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../app/index.module.css';

export default function PostList({ posts }) {
  const [order, setOrder] = useState('desc');
  const [activeTag, setActiveTag] = useState(null);
  const [query, setQuery] = useState('');

  const allTags = useMemo(() => {
    const counts = {};
    posts.forEach((p) => p.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const visible = useMemo(() => {
    const filtered = posts.filter((p) => {
      const tagOk = !activeTag || p.tags.includes(activeTag);
      const q = query.trim().toLowerCase();
      const queryOk = !q
        || p.title.toLowerCase().includes(q)
        || p.summary.toLowerCase().includes(q);
      return tagOk && queryOk;
    });
    return filtered.sort((a, b) => (order === 'desc'
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date)));
  }, [posts, activeTag, query, order]);

  return (
    <>
      <div className={styles.controls}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목·요약 검색"
          className={styles.search}
        />
        <button
          type="button"
          className={styles.sortButton}
          onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
        >
          {order === 'desc' ? '최신순 ↓' : '오래된순 ↑'}
        </button>
      </div>

      <div className={styles.tags}>
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          className={[styles.tag, activeTag ? '' : styles.tagActive].join(' ')}
        >
          {`전체 ${posts.length}`}
        </button>
        {allTags.map(([tag, count]) => (
          <button
            type="button"
            key={tag}
            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            className={[styles.tag, tag === activeTag ? styles.tagActive : ''].join(' ')}
          >
            {`${tag} ${count}`}
          </button>
        ))}
      </div>

      <p className={styles.count}>{`${visible.length}개의 글`}</p>

      <ol className={styles.posts}>
        {visible.map((post) => (
          <li key={post.id} className={styles.post}>
            <h3 className={styles.postTitle}>
              <Link href={`/article/${post.slug}`} prefetch={false}>{post.title}</Link>
            </h3>
            {post.summary && <p className={styles.postDescription}>{post.summary}</p>}
            <p className={styles.postMeta}>
              {new Date(post.date).toLocaleDateString('ko-KR')}
              {post.tags.length > 0 && ` · ${post.tags.join(', ')}`}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}
