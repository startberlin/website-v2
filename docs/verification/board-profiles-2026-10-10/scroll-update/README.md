# Profile scrolling refinement, 10 October 2026

This records the first scrolling refinement. Jannik's subsequent corrections are implemented and verified in [the plain CV and restored left column](../sidebar-update/README.md). These screenshots/results remain the earlier snapshot.

The profile breadcrumb strip and bottom return link are removed. The separate Projects & interests section is removed; selected projects appear within Experience. Duplicate project/experience URLs appear once, preserving KI Weekly and its model ranking. The shared website Header remains the site's navigation. Breadcrumb schema is removed alongside the visible breadcrumbs.

The portrait now occupies a column spanning the complete biography and CV. At a content width of 60 rem or more it stays 40 px below the 80-px header while the adjacent text scrolls. Its column bounds keep it above the footer. Narrow layouts and viewports at most 600 px high use normal flow. This is CSS sticky without profile-specific JavaScript.

| Check | Result | Evidence |
| --- | --- | --- |
| Normal text | 112 views across all eight profiles at 14 sizes. Correct portrait mode, loaded square photos, shared page edges, one main/H1, usable contacts, no local navigation, clipped text or horizontal overflow. | [Results](responsive-results.json) |
| 200-percent text | 56 views across all eight profiles at seven sizes. Actual root font 32 px, exact viewport dimensions and no overflow/clipping. | [Results](enlarged-results.json) |
| Scroll containment | 27 states: top/middle/end for all profiles, footer release at 601-px height, and mobile top/middle. Geometry matches sticky bounds; the portrait never overlaps its content column or footer. | [Results](scroll-results.json) |
| Keyboard/menu | Six cases: visible focus for LinkedIn, email and both KI Weekly links; mobile menu inert state and Escape focus return. Captured warning/error logs are empty. | [Results](interaction-results.json) |
| HTTP/metadata | 30 GET checks: all profiles and query canonicals, contact/project presence, no local navigation/breadcrumb schema, images, Board-card links, preview discovery and genuine non-Board 404s. | [Results](http-results.json), [verifier](verify-http.mjs) |
| Source checks | Design/SEO guards, all nine SEO tests, Astro typecheck (80 files, zero errors/warnings, three existing Zod hints), isolated build pass. | Commands below |

Normal sizes (CSS px): 320×900, 390×844, 768×1024, 1007×900, 1008×900, 1023×900, 1024×900, 1280×900, 1440×1000, 1920×1080, 844×390, 1024×768, 1440×600 and 1440×601. The samples cover both sides of the portrait's content-width and viewport-height boundaries.

Enlarged-text sizes: 320×900, 390×844, 768×1024, 1440×1000, 1920×1080, 844×390 and 1024×768. The existing GET-only [fixture](../text-size-fixture.mjs) adds a 200-percent root font to current build responses. It was stopped after verification. Application source is unchanged by the fixture.

Screenshots: [scrolling beside Experience](profile-sticky-desktop.jpg), [near the footer](profile-end-desktop.jpg), [mobile](profile-mobile.jpg). The browser's first capture after a wheel scroll omitted sticky compositor layers despite their correct hit targets and geometry. A heading click followed by a fresh state capture shows the actual sticky portrait and Header; that verified capture is retained. This is local browser/DOM verification, without a physical-device or spoken screen-reader audit.

The current Node preview on port 4352 serves `.astro/board-scroll-build` with indexing disabled. The previous preview process was stopped before replacement. Tracked `dist/`, dependencies and unrelated concurrent source work are preserved. No commit, push or deployment was requested. No external message or form was sent.

```sh
pnpm --config.verify-deps-before-run=false run check:design
pnpm --config.verify-deps-before-run=false run check:seo
pnpm --config.verify-deps-before-run=false run test:seo
ASTRO_TELEMETRY_DISABLED=1 pnpm --config.verify-deps-before-run=false run typecheck
SITE_INDEXABLE=false ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs build --outDir .astro/board-scroll-build
node --import tsx docs/verification/board-profiles-2026-10-10/scroll-update/verify-http.mjs
```
