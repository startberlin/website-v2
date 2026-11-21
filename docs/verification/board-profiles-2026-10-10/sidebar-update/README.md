# Plain CV and restored left column, 10 October 2026

The left column again contains the Experience, Education and Volunteering headings. Their entries stay in the right reading column. The portrait is sticky only within the introduction area. It stays below the shared Header, then yields before Experience enters the same column. At least 32 px separates the photograph from the first category label. Narrow layouts and viewports at most 600 px high keep the photograph in normal flow.

The complete quote block is removed, including its draft, placeholders and unused data/styles. CV entries have no descriptions or education notes. Projects & interests remains absent as a separate section. Jannik's model-ranking entry is removed; KI Weekly remains linked from Founder. His Founder period is "Feb 2023 - present", checked again against the actual LinkedIn experience entry. The bottom link reads "Back to the Members" and opens `/members`.

| Check | Result | Evidence |
| --- | --- | --- |
| Normal text | 112 views across all eight profiles at 14 sizes. Left category alignment, correct portrait mode, loaded photos, shared page edges, one main/H1, usable contacts/return link and plain CV content pass. No overflow/clipping. | [Results](responsive-results.json) |
| 200-percent text | 56 views across all eight profiles at seven sizes. Actual root font 32 px, exact viewport dimensions and no overflow/clipping. | [Results](enlarged-results.json) |
| Photo/section boundary | 32 states: top, early scroll, next-section approach and page end for all eight profiles. Sticky geometry matches its parent bounds; the portrait releases above Experience and never covers a category heading. | [Results](scroll-results.json) |
| Return interaction | Visible keyboard focus below the Header and Enter navigation to the real Members overview pass. Captured warning/error logs are empty. | [Results](interaction-results.json) |
| HTTP/metadata | 60 GET checks across preview and local production-policy builds. All eight routes/query canonicals, contacts, project links, Founder period, absence of quotes/descriptions/ranking, images, Board-card links, discovery and non-Board 404s pass. | [Results](http-results.json), [verifier](verify-http.mjs) |
| Source checks | Design/SEO guards, all nine SEO tests, Astro typecheck (82 files, zero errors/warnings, three existing Zod hints) and both isolated builds pass. | Commands below |

Normal sizes (CSS px): 320×900, 390×844, 768×1024, 1007×900, 1008×900, 1023×900, 1024×900, 1280×900, 1440×1000, 1920×1080, 844×390, 1024×768, 1440×600 and 1440×601. They cover both sides of the portrait's width/height boundaries.

Enlarged-text sizes: 320×900, 390×844, 768×1024, 1440×1000, 1920×1080, 844×390 and 1024×768. The existing GET-only [fixture](../text-size-fixture.mjs) adds a 200-percent root font to the final build. The fixture and production-policy server were stopped after verification. The initial return-navigation assertion was corrected to account for the existing line break in the Members heading; the destination itself was correct.

Saved visual evidence: [plain Education and the left labels](profile-background-desktop.jpg), inspected as a local image. Native browser observations also displayed the complete profile header and mobile view. Other returned screenshot buffers omitted text/image layers, so they are archived as [incomplete captures](incomplete-captures/README.md) and are not accepted as visual evidence. These are local browser/DOM checks without a physical-device or spoken screen-reader audit.

The current preview on port 4352 serves `.astro/board-plain-build` with indexing disabled. `.astro/board-plain-policy-build` was tested locally with the production configuration. Since quotes were removed, readiness now depends on the visible introduction. All eight populated public profiles join the local production-policy sitemap, which contains 14 pages; previews still emit noindex and empty sitemaps. This does not publish the site or change live indexing.

Tracked `dist/`, dependencies and unrelated concurrent work are preserved. No commit, push or deployment was requested. No external message or form was sent. The temporary LinkedIn research tab was closed.

```sh
pnpm --config.verify-deps-before-run=false run check:design
pnpm --config.verify-deps-before-run=false run check:seo
pnpm --config.verify-deps-before-run=false run test:seo
ASTRO_TELEMETRY_DISABLED=1 pnpm --config.verify-deps-before-run=false run typecheck
SITE_INDEXABLE=false ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs build --outDir .astro/board-plain-build
PUBLIC_SITE_URL=https://www.start-berlin.com SITE_INDEXABLE=true ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs build --outDir .astro/board-plain-policy-build
node --import tsx docs/verification/board-profiles-2026-10-10/sidebar-update/verify-http.mjs
```
