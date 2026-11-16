import '../styles/globals.css';
// eslint-disable-next-line camelcase
import { Noto_Sans_KR as NotoSansKR, Noto_Serif_KR as NotoSerifKR } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import Providers from '../components/providers';
import {
  OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, buildOpenGraph,
} from '../lib/site';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const notoSansKr = NotoSansKR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
});

const notoSerifKr = NotoSerifKR({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: buildOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    images: [OG_IMAGE.url],
  },
  alternates: {
    types: { 'application/rss+xml': [{ url: '/rss.xml', title: SITE_NAME }] },
  },
  verification: {
    other: {
      'google-site-verification': 'd6NqV68WVvXhJlU0h2Gh7LCUwicdl0An9s--sfGmJik',
      'naver-site-verification': '9d57ce4eda1cbe652fd7cb9617e6035dd82b0d61',
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      {/* Only the CSS variables — a font's own className would override the
          serif body font declared in globals.css. */}
      <body className={`${notoSansKr.variable} ${notoSerifKr.variable}`}>
        <Providers>{children}</Providers>
        <Analytics />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
