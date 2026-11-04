# Board profiles verification, 10 October 2026

These artifacts record the initial profile implementation and five-layout comparison. The [plain CV and restored left column](sidebar-update/README.md) contain the current source/preview evidence after Jannik's corrections: no quote block or CV descriptions, left category labels, bounded sticky portrait and a Members return link. The earlier [scrolling refinement](scroll-update/README.md) and initial screenshots/results remain dated snapshots.

The Board now has two independent rows: President, Vice President and Head of Finance, followed by the five department heads. All eight have prerendered detail routes, linked from Board cards and their department cards. The roster remains 45 unique people and 50 rendered cards. Normal members have no detail routes.

The selected [editorial split](design-options.md) contains the existing photo, contacts, introduction, quote area and a minimal CV with project links. [Content sources](../../board-profile-sources.md) document the LinkedIn research and Jannik's requested personal draft. Six quotes remain pending; Jannik's quote is labelled as a draft and Rhema's quote comes from his About section. Sparse CV sections retain explicit placeholders.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Normal text | 153 views: all nine routes at 17 sizes. No overflow/clipping; one main/H1; loaded profile photos and usable contacts. | [Results](responsive-results.json) |
| 200-percent text | 81 views at nine sizes, including landscape. Actual root font is 32 px; every recorded viewport matches its intended dimensions. No overflow/clipping or collapsed search input. | [Results](enlarged-results.json), [fixture](text-size-fixture.mjs) |
| Five designs | 25 views at 320, 390, 768, 1024 and 1440 px; no overflow/clipping. | [Comparison](design-options.md), [measurements](comparison-results.json) |
| Missing portrait | Named initials fallback at 320 px with normal/enlarged text. | [Results](fallback-results.json) |
| Interactions | 17 cases: search, combined filters, unique counts, empty/reset states, keyboard focus, independent contacts, card navigation, return anchor, mobile menu and real project destination. | [Results](interaction-results.json) |
| HTTP and SEO | 60 GET checks across preview/production policies. Metadata, query canonicals, schema, images, crawler policy, sitemap and genuine 404s pass. | [Results](http-results.json), [verifier](verify-http.mjs) |
| Project checks | Design/SEO guards and all 56 existing tests pass. Astro checks 78 files with zero errors/warnings and three existing Zod hints. Both isolated Node builds pass. | Commands below |

Normal-text sizes (CSS px): 320×900, 390×844, 639×900, 640×900, 767×900, 768×1024, 959×900, 960×900, 1007×900, 1008×900, 1023×900, 1024×900, 1280×900, 1440×1000, 1920×1080, 844×390 and 1024×768.

Enlarged-text sizes: 320×900, 390×844, 768×1024, 1024×900, 1280×900, 1440×1000, 1920×1080, 844×390 and 1024×768. The fixture adds only a 200-percent root font to the final build's HTML responses. Application source stays untouched. Earlier measurements from a stale browser-tab handle were discarded; final results check actual dimensions in every view.

Verification fixed a portrait exceeding its narrow enlarged-text container and the existing search field shrinking to zero at 768 px. Profile and filter container queries now adapt to text size. At heights of 600 px or less the filter bar scrolls with the page. Its measured sticky height sets the focus/anchor offset. Keyboard checks confirm visible focus below the sticky bars.

Native accessibility snapshots were inspected, and keyboard navigation was exercised. The mobile menu applies inert to the header bar, main and footer, then restores focus on Escape. Shared reduced-motion styles are preserved; profiles add no motion. This is browser/DOM verification, without a spoken screen-reader or physical-device audit. Captured browser error/warning logs are empty.

## Screenshots

- [Board desktop](board-desktop.jpg) and [mobile](board-mobile.jpg).
- [Jannik's profile desktop](profile-desktop.jpg), [CV](profile-background-desktop.jpg) and [mobile](profile-mobile.jpg).
- [Large text in landscape](enlarged-directory-landscape.jpg).

## Local build boundary

The final preview is `.astro/board-final-build`, served on port 4352 with indexing disabled. `.astro/board-production-policy-build` was tested locally with the public origin and indexing enabled. This does not publish or change indexing on the real website. The production-policy and text-size fixture servers were stopped after verification.

Preview HTML uses robots noindex; runtime discovery endpoints also return X-Robots-Tag. The Node adapter serves prerendered HTML as static files, so those responses rely on their HTML robots tag. Preview sitemaps are empty and robots.txt disallows crawling. In the production-policy test only Rhema's complete profile joins the sitemap; pending/draft quotes keep the other profiles noindex. Readiness is shared between route metadata and sitemap. Removed comparison routes and non-board/unknown slugs return HTTP 404 without canonical/schema.

LinkedIn profiles were read and KI Weekly's ranking was opened through the project link. Email hrefs and separate hit targets were checked; no email or external form was sent. Tracked `dist/` and unrelated source/dependency work are preserved. No commit, push or production deployment was requested.

```sh
pnpm --config.verify-deps-before-run=false run check:design
pnpm --config.verify-deps-before-run=false run check:seo
pnpm --config.verify-deps-before-run=false run test:seo
pnpm --config.verify-deps-before-run=false run test:jobboard
ASTRO_TELEMETRY_DISABLED=1 pnpm --config.verify-deps-before-run=false run typecheck
ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs build --outDir .astro/board-final-build
PUBLIC_SITE_URL=https://www.start-berlin.com SITE_INDEXABLE=true ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs build --outDir .astro/board-production-policy-build
```
