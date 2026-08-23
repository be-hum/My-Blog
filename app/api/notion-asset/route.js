import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// Notion signed file URLs expire after ~1 hour, so static HTML can't hold them.
// This route resolves a fresh URL per request and redirects to it.
const REDIRECT_CACHE_SECONDS = 3000;
const UUID_PATTERN = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

const notion = new Client({ auth: process.env.NOTION_TOKEN });

function extractUrl(block) {
  const value = block?.[block?.type];
  if (!value) return null;
  return value.type === 'external' ? value.external?.url : value.file?.url;
}

export async function GET(request) {
  const blockId = request.nextUrl.searchParams.get('blockId');

  if (!blockId || !UUID_PATTERN.test(blockId)) {
    return NextResponse.json({ error: 'Invalid blockId' }, { status: 400 });
  }

  try {
    const block = await notion.blocks.retrieve({ block_id: blockId });
    const url = extractUrl(block);

    if (!url) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.redirect(url, {
      status: 307,
      headers: {
        'Cache-Control': `public, max-age=${REDIRECT_CACHE_SECONDS}, s-maxage=${REDIRECT_CACHE_SECONDS}`,
      },
    });
  } catch (error) {
    const status = error?.status === 404 ? 404 : 502;
    return NextResponse.json({ error: 'Failed to resolve asset' }, { status });
  }
}

export const dynamic = 'force-dynamic';
