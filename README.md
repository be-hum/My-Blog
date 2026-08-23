# COMPUTUDY NOTE

Notion을 CMS로 사용하는 개인 학습 노트 블로그. Notion에 글을 쓰면 별도 배포 없이 사이트에 반영된다.

**Live:** https://computudy-note.vercel.app

## 스택

- **Next.js 13** (App Router, React Server Components)
- **Notion Public API** (`@notionhq/client`) — 콘텐츠 소스
- **next-themes** — 다크 모드
- **Vercel** — 호스팅 및 ISR

## 주요 기능

- 제목·요약 검색, 태그 필터, 날짜 정렬 (클라이언트 사이드)
- 라이트/다크 테마 전환 (시스템 설정 연동)
- 12시간 주기 ISR — Notion 변경분이 재배포 없이 반영
- Notion 이미지·첨부파일 프록시 (아래 참조)
- 사이트맵, robots.txt, Open Graph 메타데이터
- Google Analytics + Vercel Analytics

## Notion 데이터베이스 스키마

Notion 데이터베이스에 아래 속성이 있어야 한다. `status`가 `Public`이고 `type`이 `Post`인 항목만 노출된다.

| 속성 | 타입 | 용도 |
| --- | --- | --- |
| `title` | Title | 글 제목 |
| `slug` | Rich text | URL 경로 (`/article/<slug>`) |
| `summary` | Rich text | 목록에 표시되는 요약 |
| `tags` | Multi-select | 태그 필터 |
| `category` | Select | 분류 |
| `date` | Date | 정렬 기준 |
| `status` | Select | `Public`일 때만 공개 |
| `type` | Select | `Post` = 글 |

About 페이지는 `slug`가 `about`인 항목을 사용한다 (`type` 무관).

## 로컬 실행

Notion [integration](https://developers.notion.com/docs/getting-started)을 만들고 데이터베이스에 연결한 뒤, 루트에 `.env.local`을 생성한다.

```
NOTION_TOKEN=
NOTION_DATABASE_ID=
NEXT_PUBLIC_GA_ID=
```

`NEXT_PUBLIC_GA_ID`는 Google Analytics를 쓰지 않으면 비워둬도 된다.

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인.

## 구조

```
app/
  page.js                    홈 (글 목록)
  article/[slug]/page.js     글 상세
  about/page.js              소개
  api/notion-asset/route.js  이미지·첨부파일 프록시
  layout.js                  폰트, 메타데이터, 애널리틱스
  sitemap.js  robots.js
components/
  post-list.js               검색·태그·정렬 UI
  notion/renderer.js         Notion 블록 → JSX
  text.js                    rich text 렌더링
  theme-toggle.js  providers.js
lib/
  notion.js                  Notion API 클라이언트
styles/
  globals.css                디자인 토큰, 타이포그래피
  post.module.css            글 본문 스타일
```

## 알아둘 점

### 이미지 프록시

Notion API가 반환하는 파일 URL은 서명된 S3 링크로 약 1시간 뒤 만료된다. 정적으로 렌더된 페이지에 이 URL이 박히면 배포 직후부터 이미지가 깨진다.

그래서 이미지와 첨부파일은 `/api/notion-asset?blockId=<id>`를 거친다. 이 라우트가 요청 시점에 Notion에서 새 URL을 받아 리다이렉트하므로 HTML에는 만료되지 않는 경로만 남는다. 외부 URL(`external` 타입)은 만료되지 않으므로 그대로 사용한다.

### 갱신 주기

`revalidate`는 라우트 세그먼트(`page.js` / `layout.js` / `route.js`)에서 export할 때만 적용된다. `lib/` 같은 일반 모듈에 두면 무시되므로 각 페이지가 자체적으로 선언한다. 현재 값은 43200초(12시간).

### 지원하지 않는 블록

Notion의 `alias` 블록은 공개 API가 내용을 반환하지 않아 렌더링할 수 없다. 개발 모드에서만 경고 문구가 보이고 프로덕션에서는 조용히 생략된다.

## 배포

Vercel에 연결된 상태에서 `main`에 푸시하면 자동 배포된다. 환경 변수는 Vercel 프로젝트 설정에 동일하게 등록해야 한다.

## 라이선스

MIT. [samuelkraft/notion-blog-nextjs](https://github.com/samuelkraft/notion-blog-nextjs)를 기반으로 만들었다.
