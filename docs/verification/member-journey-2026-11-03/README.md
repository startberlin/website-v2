# Member Journey verification, 3 November 2026

The new `/member-journey` page explains START Berlin membership in five stages, the five departments and seven member stories. It has no call to action while applications are closed. All copy comes from the approved content and is server-rendered. The page adds four components ([JourneyStages](../../../src/components/member-journey/JourneyStages.astro), [DepartmentTabs](../../../src/components/member-journey/DepartmentTabs.astro), [SectionHeading](../../../src/components/SectionHeading.astro) and [Testimonial](../../../src/components/Testimonial.astro)), one typed content module, ten local images and a page registry entry. Shared PageHero gains an optional description paragraph and a `data-hero-outline` title hook.

Checks used Node.js v22.23.3 and headless Chromium 145 (Playwright) against isolated local builds. Tracked `dist/`, `package.json` and both lockfiles are unchanged. No Cockpit credentials, forms, external requests or deployments were used. Temporary built servers are stopped after the checks.

[Full results](checks.json). Screenshots: [journey at 1440 px](desktop-1440-journey.jpg), [sticky band at stage 03](desktop-1440-stage03-sticky.jpg), [departments at 1440 px](desktop-1440-departments.jpg), [member stories at 1280 px](desktop-1280-stories.jpg), [journey at 390 px](mobile-390-journey.jpg).

## Automated checks

| Check | Result |
| --- | --- |
| `check:design` | Pass, 28 stylesheets/blocks, 135 defined custom properties |
| `check:seo` | Pass, 12 HTML route templates |
| `test:seo` | 9 pass. The sitemap tests now expect `/member-journey` (15 URLs) |
| `typecheck` | 115 files, 0 errors, 0 warnings, 6 existing hints in files this change does not touch |
| `test:jobboard` | 47 pass |
| `test:release` | 28 pass |
| `pnpm test` | 95 pass |
| `test:dependencies` | 6 pass |
| Isolated build, `.astro/member-journey-build` | Pass |
| `smoke:local` on that build | Pass, 9 pages; Jobs returns its controlled 503 without Cockpit (not backend acceptance) |
| `build:vercel`, `.astro/vercel-build` | Pass |

## SEO

- **Indexable test build:** built to `.astro/member-journey-indexable` with `PUBLIC_SITE_URL=https://www.start-berlin.com SITE_INDEXABLE=true`; this output is git-ignored and not committed.
  - `/member-journey` returns 200 with title "Member journey: from application to alumni | START Berlin" and canonical `https://www.start-berlin.com/member-journey`.
  - Robots meta is `index, follow, …`.
  - The page appears in `sitemap-pages.xml`, which lists 15 URLs, and robots.txt allows crawling.
- **Preview build** (`SITE_INDEXABLE=false`): the same page renders `noindex, follow`, `sitemap-pages.xml` is empty and robots.txt disallows crawling.
- **Page structure:** one H1, the heading outline below, no structured data beyond the shared graph, and no Review schema for the quotes.

Heading outline: H1 "Your START Berlin Journey"; H2 for each of the five stages; H2 "Our Departments" with an H3 per department; H2 "Member Stories".

## Shared PageHero

PageHero consumers were compared against a baseline built from `main` before this branch (`.astro/pagehero-baseline`).
- **Screenshots:** full-page screenshots of `/`, `/join`, `/members`, `/jobs` and `/404` at the nine viewports below are pixel-identical (45 of 45), with no horizontal overflow.
- **Markup:** the step (a) HTML comparison found identical markup. The one difference: on `/jobs`, PageHero's CSS is now delivered as an external stylesheet instead of inline, because the stylesheet crossed Astro's inline size limit. Rendering is unchanged.
- **Header:** the existing Community link to Member Journey now resolves with 200. No Header code changed; the styleguide now lists three reserved destinations instead of four.

## Browser verification

**Viewports.** 320 × 640, 390 × 844, 768 × 1024, 1024 × 768, 1280 × 800, 1440 × 900, 1920 × 1080, 844 × 390 and 1180 × 820, each with JavaScript on and off (18 views).
- No horizontal overflow at the top, middle or end of the page, no element outside the viewport, and no console or page errors.
- All 14 images load, and every view has one H1.
- **Rail:**
  - Vertical beside each stage at 320 and 390 px.
  - Static horizontal wave at 768 × 1024 and 844 × 390 (viewport below 45 rem high).
  - Sticky band at 1024 px and wider with at least 45 rem height.
- **Stage layout:** text and photo sit side by side, photo level with the eyebrow (offset 0 px), from 1024 px and at 844 × 390. One column, photo after the bullets, at 768 px and below.
- **Stage states, JavaScript on:** at the top, stage 01 is current. At stage 03, 01–02 are reached, 03 is current and 04–05 are upcoming, with `aria-current="step"` on the 03 link. At the end, 01–04 are reached and 05 is current.
- **JavaScript off:** no states are set, all stages and rail links stay usable, and all five department panels are visible.
- **Departments:** with JavaScript the tab list replaces the stacked panels and one panel is visible.

**Enlarged text.** Tested with a 32-px root font, which is a controlled 200% text check, not operating-system zoom. At 320, 768 and 1280 px, with JavaScript on and off:
- No horizontal overflow, no element outside the viewport and no clipped text.
- Because the container queries use rem, the vertical rail stays in use at all three widths.

**Anchors.** Each rail link (or `#stage-…` without JavaScript) lands the stage eyebrow below the header and band:
- 72–73 px clear at 1440 × 900 (JavaScript on and off) and at 1024 × 768.
- 36 px clear at 390 × 844 (JavaScript on and off).

**Keyboard** (1440 × 900).
- The main content has seven tab stops: the five rail links, the selected department tab and the department panel.
- Every stop shows the shared focus outline, and none is hidden under the header or band.
- Department tabs:
  - Arrow Down/Up, Home and End move focus and selection together, and Arrow Up wraps from the first to the last tab.
  - Only one tab is in the tab order.
  - Tab then moves to the panel, which has `role="tabpanel"` and `aria-labelledby` set to its tab.
- Member Stories has no interactive elements.

**Reduced motion.** With `prefers-reduced-motion: reduce` emulated, 26 scroll samples gave only the progress values 0, 0.25, 0.5, 0.75 and 1 (whole stages). No element in the journey has a transition. Nothing animates on its own, so no pause control is needed.

**Touch targets.** Rail links are 56 × 56 px. Department tabs are 84 px high at 1440 px.

**Contrast.** Measured at 1440 px with alpha colours blended against the actual background.

| Element | Ratio |
| --- | --- |
| Stage title and bullets | 20.26:1 |
| Intro, section lead, muted rail labels | 9.72:1 |
| Eyebrow, current rail label, reached and current node numbers | 9.52:1 |
| Upcoming node numbers | 20.26:1 |
| Upcoming node ring (non-text, `--border-control`) | 3.65:1 |
| Department names | 20.26:1 unselected, 9.52:1 selected |
| Department card text (dark blue on cyan) | 9.52:1 |
| Testimonials on their translucent surfaces | Quotes ≥ 18.01:1, roles ≥ 9.09:1 |

**Server-rendered HTML.**
- 14 images, all with alt, width and height.
- No HTML comments, no `target="_blank"` links, no external scripts, no iframes and no "Apply now" in `main`.
- The only `data-*` attributes are functional hooks: Astro scope IDs, shared Header/PageHero hooks, and the journey, department and outline hooks.
- All stage text (including the final stage 03 wording) and all seven testimonials are in the initial HTML.

## Game slot

`game.enabled` was set to `true` locally and built to `.astro/member-journey-game`. At all nine viewports:
- The empty `#member-journey-game` section renders between Departments and Member Stories, on the same `.page-container` edges, with its reserved 20 rem (320 px) height.
- There is no overflow, the heading outline is unchanged (13 headings, one H1) and there is no iframe.

The flag was then set back to `false` and `git diff` confirmed the data module unchanged. The committed page does not render the section. Embed requirements for the later integration are in the comment on `game` in [member-journey.ts](../../../src/data/member-journey.ts).

## Deviations from the plan

- **Upcoming node ring:** uses `--border-control` instead of `--border-strong`, so the indicator reaches 3:1 contrast.
- **Stage states:** one rAF-throttled scroll handler sets both the states and the fill. The planned IntersectionObserver was dropped so both stay consistent.
- **Phone rail:** on the vertical rail, the line fills one stage segment at a time rather than continuously.
- **Stage layout:** photos sit to the right of the stage text with one 4:3 frame for every photo (later revision). The Langdock photo uses `object-position: 50% 20%` so both speakers' faces stay in frame.
- **Extra test file:** `src/lib/seo/routes.test.ts` needed the new sitemap count (one file more than planned).

## Not verified

- **Browsers and devices:** only Chromium was tested. No Safari, Firefox, real phones or tablets, and no operating-system zoom.
- **Screen readers:** no spoken screen-reader audit was done.
- **Production:** no production or preview deployment, live indexing, Search Console or field Core Web Vitals.
- **Shared PageHero, pre-existing:** at 200% text on 320 px the hero title breaks inside a word (for example "BERLI-N") on every route that uses it. This predates this change; it causes no overflow.
- **People:**
  - Photo consent for the people shown in the stage photos still needs confirmation.
  - Confirm the portrait file matches: Lion_Herbert is Lion Abboud Herbert, Soenke_Peters is Sönke Peters.

## Security (SECURITY.md §19)

1. **Scope reviewed.**
   - What this covers: on 3 November 2026, the Member Journey page and its components, the PageHero extension, the content module and images, and the SEO registry entry.
   - What it is: a static, prerendered page with two small progressive-enhancement scripts.
   - Sections that apply:
     - Secrets and configuration.
     - Output encoding and XSS.
     - Security headers.
     - Supply chain.
     - Data protection for the images.
     - Embedding, for the future game iframe.
   - Not applicable, because the page has none of these:
     - Authentication, sessions and access control.
     - Input validation and forms.
     - File uploads.
     - Payments.
     - APIs and webhooks.
     - Database.
     - Rate limiting.
     - LLM features.
2. **Security measures implemented.**
   - **Output encoding:** all content is rendered through Astro expressions, with no `set:html`, `innerHTML`, `eval` or dynamic script sources.
   - **Scripts:** both scripts only set attributes, classes and custom properties.
   - **No external code:** no external links, scripts, fonts or iframes, and no new dependencies.
   - **Image metadata:** all ten added JPEGs were re-encoded without EXIF, IPTC, XMP or ICC data.
   - **Sprint photo:** cropped so no certificate names are legible.
   - **Game embed:** the iframe sandbox and `postMessage` origin requirements are documented next to the flag.
3. **Checks performed.**
   - **Grep of the branch diff:** found no keys, tokens, `PUBLIC_` variables, environment access, `fetch`, `innerHTML`, `set:html`, `eval`, `postMessage` (outside the requirements comment), `target="_blank"` or plain `http://` URLs.
   - **`.env`:** not tracked; only `.env.example` is.
   - **Unchanged against `main`:** lockfiles, `package.json` and `dist/`.
   - **Image metadata:** checked with sharp.
   - **Built HTML:** no comments, no external scripts and no unsafe `target="_blank"`.
   - **Tests:** `test:dependencies` passes (6).
   - **Headers:** checked on the local built server.
4. **Fixed.** Nothing security-relevant was found in this change.
5. **Not fixed / needs human action.**
   - **Medium, existing.** Prerendered pages are served without the middleware security headers (CSP `frame-ancestors`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`). This affects every prerendered route, including `/members` and `/member-journey`.
     - Evidence: the local Node server returns them only on server-rendered routes such as `/jobs`, and the generated `.vercel/output/config.json` contains no CSP or `nosniff` rule. Hosted response headers were not checked on a deployment.
     - Recommendation: add the same headers for static output in hosting configuration, in a separate change.
   - **Existing dependency advisories.** `pnpm audit --prod` reports 17 (1 low, 10 moderate, 6 high) in undici, vite (including launch-editor), zod, glob and minimatch.
     - This change does not alter dependencies, and UI-only work keeps the lockfiles unchanged.
     - Recommendation: a separate dependency update PR.
6. **Residual risks and recommendations.**
   - **Game embed:** when it is integrated, review the sandbox permissions, the exact `postMessage` origin allow-list and a CSP `frame-src` if one is added.
   - **Consent:** confirm photo consent before release.
