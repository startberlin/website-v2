# SEO verification, 10 October 2026

The shared SEO foundation is implemented locally in the current Astro source. Research, decisions and future-page instructions are in [SEO.md](../../SEO.md). This verifies local built output, not a production deployment or search-engine indexing.

## Automated checks

- `check:seo` passes for all ten HTML route templates. The same inventory check runs automatically in Astro builds. It enforces registered routes and shared layouts, unique page metadata, head ownership and matching search/social image dimensions.
- All 56 tests pass: nine new SEO tests and the 47 existing Jobboard tests. They cover production/preview policy, canonical URL normalization, schema escaping, inventory omissions, filter exclusions, discovery XML and existing Jobs behaviour.
- Astro typecheck passes across 75 files with zero errors/warnings and the three existing deprecation hints.
- The design check passes across 22 stylesheets/blocks, using 124 defined custom properties.
- Isolated Node builds pass for indexable production policy and non-indexable preview policy in `.astro/seo-production-build` and `.astro/seo-preview-build`. Tracked `dist/` is preserved.

## Built output and browser checks

[http.json](http.json) records 48 HTTP/HTML checks. Each consuming route/state has one title, description, robots directive and social-card set, with matching canonical/schema URLs. Successful pages expose one H1/main/footer. Error pages retain 404/503 and omit canonical/schema. The existing Jobs CSP, no-store and other response headers remain intact; the application redirect retains `no-referrer`.

Production-policy discovery exposes six page URLs and a separate active-role sitemap. The synthetic fixture supplied 27 ordinary active jobs plus an active script-escaping fixture, and two excluded closed/expired roles. Root/page discovery remains available when Cockpit is unavailable, while the Jobs sitemap returns 503. Preview maps are empty and preview robots.txt excludes crawling. Existing legal redirects, wrong-slug normalization and application redirects pass. Source attribution does not enter canonical URLs. Host/proxy input does not alter configured public identity URLs. Both raster assets return 200 with the expected types and declared dimensions.

[browser.json](browser.json) records 84 browser views across twelve consuming route/state combinations at 320, 390, 768, 1024, 1280, 1440 and 1920 CSS pixels. Another 24 views cover phone/tablet landscape at 844 × 390 and 1024 × 768. They have one H1/main/footer and no horizontal page overflow. Six new-404 views at 320, 390, 768, 1024, 1280 and 1920 use a read-only 32-pixel root-font fixture to check 200-percent text size; no horizontal overflow was found. This is a controlled font-size check, not an operating-system zoom or spoken screen-reader audit.

The 404 actions are keyboard-reachable. Tab from Back to home focuses Browse jobs; clicking them reaches the actual Home/Jobs routes. The native accessibility tree exposes their link names and the page heading. The final browser console sample contains no errors/warnings. Shared Home/Join/Members body interactions remain covered by their earlier verification; this task added no client interaction code.

Screenshots: [404 at 390 px](404-mobile.png), [404 at 1280 px](404-desktop.png).

## Boundary

All Jobs data came from a local GET-only synthetic fixture. No live Cockpit mutation, application submission, employer submission or external sharing occurred. Test application redirects were inspected without following the synthetic employer destination. Temporary verification servers are stopped after the checks; the existing workspace preview is preserved.

The source retains concurrent navigation/style and hosting-dependency work. Those changes are outside this SEO implementation; the tested adapter remains the current standalone Node adapter. Production configuration, reserved unbuilt navigation destinations, legal/content reconciliation and actual external delivery still follow the parent working plan. Configure the same origin/indexing policy at build and runtime before release, then verify the public host with Search Console, Bing Webmaster Tools and schema tools. Local tests do not establish rich-result eligibility, rankings, AI citations or field Core Web Vitals.
