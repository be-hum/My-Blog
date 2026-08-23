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

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const getDatabase = cache(async () => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        { property: 'status', select: { equals: 'Public' } },
        { property: 'type', select: { equals: 'Post' } },
      ],
    },
    sorts: [{ property: 'date', direction: 'descending' }],
  });
  return response.results;
});

export const getPage = cache(async (pageId) => {
  const response = await notion.pages.retrieve({ page_id: pageId });
  return response;
});

export const getPageFromSlug = cache(async (slug) => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'slug',
      rich_text: { equals: slug },
    },
  });
  return response?.results?.[0] ?? {};
});

export const getPageBySlugAnyType = cache(async (slug) => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: { property: 'slug', rich_text: { equals: slug } },
  });
  return response?.results?.[0] ?? null;
});

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

export const getBlocks = cache(async (blockID) => {
  const blockId = blockID.replaceAll('-', '');
  const { results } = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });

  const childBlocks = [];
  for (const block of results) {
    if (block.has_children) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(120);
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
