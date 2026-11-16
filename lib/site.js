export const SITE_URL = 'https://computudy-note.vercel.app';
export const SITE_NAME = 'COMPUTUDY NOTE';
export const SITE_DESCRIPTION = '개인 학습 노트';
export const SITE_LOCALE = 'ko_KR';

export const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: SITE_NAME,
};

// A child segment's `openGraph` fully replaces the parent's (shallow merge),
// so every page must build the complete object.
export function buildOpenGraph(overrides = {}) {
  return {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    images: [OG_IMAGE],
    ...overrides,
  };
}
