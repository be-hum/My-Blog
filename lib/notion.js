/* eslint-disable no-restricted-syntax, no-await-in-loop */

import { Client } from '@notionhq/client';
import { cache } from 'react';

// Note: `revalidate` only takes effect when exported from a route segment
// (page.js / layout.js / route.js), so each page declares its own.

const databaseId = process.env.NOTION_DATABASE_ID;

/**
 * Returns a random integer between the specified values, inclusive.
 * The value is no lower than `min`, and is less than or equal to `max`.
 *
 * @param {number} minimum - The smallest integer value that can be returned, inclusive.
 * @param {number} maximum - The largest integer value that can be returned, inclusive.
 * @returns {number} - A random integer between `min` and `max`, inclusive.
 */
function getRandomInt(minimum, maximum) {
  const min = Math.ceil(minimum);
  const max = Math.floor(maximum);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Notion allows ~3 requests/second on average. Space request starts out and
// retry on 429 (honouring Retry-After) so bursts don't turn into errors.
const MIN_INTERVAL_MS = 350;
const MAX_RETRIES = 5;
// Notion's Retry-After is often ~45s. That is fine during `next build`, but a
// serverless function can't wait that long: fail fast and let ISR keep serving
// the previously generated page.
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const MAX_WAIT_MS = isBuild ? 120000 : 3000;
const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

let nextSlot = 0;
async function throttle() {
  const now = Date.now();
  const start = Math.max(now, nextSlot);
  nextSlot = start + MIN_INTERVAL_MS;
  if (start > now) await sleep(start - now);
}

export async function notionRequest(fn) {
  for (let attempt = 0; ; attempt += 1) {
    await throttle();
    try {
      return await fn(notion);
    } catch (error) {
      const retryable = error?.status === 429 || error?.code === 'rate_limited'
        || error?.status === 502 || error?.status === 503;
      if (!retryable || attempt >= MAX_RETRIES) throw error;
      const retryAfter = Number(error?.headers?.get?.('retry-after') ?? error?.headers?.['retry-after']);
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 1000 * 2 ** attempt;
      if (wait > MAX_WAIT_MS) throw error;
      nextSlot = Math.max(nextSlot, Date.now() + wait);
      await sleep(wait);
    }
  }
}

export const getDatabase = cache(async () => {
  const response = await notionRequest((n) => n.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        { property: 'status', select: { equals: 'Public' } },
        { property: 'type', select: { equals: 'Post' } },
      ],
    },
    sorts: [{ property: 'date', direction: 'descending' }],
  }));
  return response.results;
});

export const getPage = cache(async (pageId) => {
  const response = await notionRequest((n) => n.pages.retrieve({ page_id: pageId }));
  return response;
});

export const getPageFromSlug = cache(async (slug) => {
  const response = await notionRequest((n) => n.databases.query({
    database_id: databaseId,
    filter: {
      property: 'slug',
      rich_text: { equals: slug },
    },
  }));
  return response?.results?.[0] ?? {};
});

export const getPageBySlugAnyType = cache(async (slug) => {
  const response = await notionRequest((n) => n.databases.query({
    database_id: databaseId,
    filter: { property: 'slug', rich_text: { equals: slug } },
  }));
  return response?.results?.[0] ?? null;
});

export const getBlocks = cache(async (blockID) => {
  const blockId = blockID.replaceAll('-', '');
  const results = [];
  let cursor;
  do {
    const startCursor = cursor;
    const res = await notionRequest((n) => n.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: startCursor,
    }));
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  const childBlocks = [];
  for (const block of results) {
    if (block.has_children) {
      // eslint-disable-next-line no-await-in-loop
      const children = await getBlocks(block.id);
      childBlocks.push({ ...block, children });
    } else {
      childBlocks.push(block);
    }
  }

  return childBlocks.reduce((acc, curr) => {
    if (curr.type === 'bulleted_list_item') {
      if (acc[acc.length - 1]?.type === 'bulleted_list') {
        acc[acc.length - 1][acc[acc.length - 1].type].children?.push(curr);
      } else {
        acc.push({
          id: getRandomInt(10 ** 99, 10 ** 100).toString(),
          type: 'bulleted_list',
          bulleted_list: { children: [curr] },
        });
      }
    } else if (curr.type === 'numbered_list_item') {
      if (acc[acc.length - 1]?.type === 'numbered_list') {
        acc[acc.length - 1][acc[acc.length - 1].type].children?.push(curr);
      } else {
        acc.push({
          id: getRandomInt(10 ** 99, 10 ** 100).toString(),
          type: 'numbered_list',
          numbered_list: { children: [curr] },
        });
      }
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);
});
