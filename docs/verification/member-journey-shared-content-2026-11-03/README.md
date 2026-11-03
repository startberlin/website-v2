# Member Journey and Join shared content verification

Verified on 3 November 2026 with Node.js 22.23.4 and Chromium. This follow-up starts from Member Journey PR #20 at `61c82e84a1d979a436f7d57fa7561393dc6d5732`.

## Content and integration

`src/data/member-journey.ts` owns the department names and paragraphs, all seven member stories and the annual membership fee. Join imports these records directly. People replaces the old Community label, and both paragraphs of the Partnerships description render. The story heading includes current members as well as alumni. The two existing Join LinkedIn destinations are preserved in the shared records.

Both pages use "€40 per year, paid annually" from the same exported value. The closed application state and existing form destinations remain in place. No dependency or lockfile changes are included.

## Checks

- Design and SEO inventory guards pass.
- All 95 tests pass, including the nine SEO tests, 47 Jobboard tests, release tests and dependency regression tests.
- Astro typecheck: 115 files, zero errors, zero warnings and six existing hints.
- Separate Node preview and indexable-policy builds pass. Vercel build and isolated packaged-function startup pass.
- Built-server smoke passes for nine current pages. Jobs returns its controlled unavailable state without Cockpit configuration.
- Preview HTML has the staging canonical and noindex. Its sitemap is empty and robots.txt disallows crawling. The local indexable-policy build has the www canonical, index/follow and 15 sitemap URLs including Member Journey. Both retain actual 404 responses for missing routes.
- Browser checks cover both pages at 320 × 640, 390 × 844, 768 × 1024, 1024 × 768, 1280 × 800, 1440 × 900, 1920 × 1080, 844 × 390 and 1180 × 820, each with JavaScript enabled and disabled: 36 views, with no page errors or horizontal overflow.
- All seven stories and the annual fee are present on both pages. All five department panels remain available without JavaScript. Department arrow keys, Home/End and wrapping selection pass. All five journey anchors land below the sticky band.
- Both pages pass enlarged-text reflow at 320, 768 and 1280 pixels using a 32-pixel root font. Desktop and phone screenshots were visually reviewed.
- Talent Pool, Contact and Apply destinations return HTTP 200. No form was submitted.

## Limits

This is local verification. No Safari, Firefox, spoken screen-reader pass, real-device zoom, field Core Web Vitals or production indexing is established. HTTP access to a form does not establish delivery. The original PR verification remains dated evidence for its recorded initial source.

The existing dependency advisories and missing general static-page security headers are separate review concerns. This content follow-up does not change their controls.
