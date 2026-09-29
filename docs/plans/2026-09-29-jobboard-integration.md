# Jobboard integration plan

Historical plan approved on 29 September 2026. The original proposal and planning observations below are preserved as a record; they describe the state before implementation. The current implementation update at the end of this document supersedes its adapter, visual-treatment and pagination proposals. This is a work-in-progress feature branch, with production release still pending. Runtime notes are maintained separately in the Cockpit project at `docs/jobboard/WEBSITE-V2-SERVER-ADAPTER.md`.

Target: `/Users/jannik/Developer/start_website/website-v2`, branch `feature/jobboard-integration`, based on `fecf796`. Source: `/Users/jannik/Developer/start_jobboard_public`, preview branch `feature/website-v2-migration`. The existing untracked `design/` material is preserved. The native Astro implementation now follows this plan. Verification evidence is in `docs/verification/jobboard-2026-09-29/`.

## Recommended outcome

Move the public jobboard experience into the current Astro website at `/jobs`. Reuse Cockpit as the only editorial and database backend. Visitors browse and apply without a START account. Employer submissions continue to enter Cockpit's pending-review queue.

Use Astro for the shared layout and server-rendered pages. Reuse the tested filter and submission components as two small React islands rather than rewriting their behavior. Retire the second public Next.js deployment only after the v2 implementation passes acceptance. Keep the source repository available for rollback and reference.

This public migration requires no new database schema or database-provider configuration. Cockpit's own deployment still needs the prepared Jobboard migration `0061`, after Newsletter's `0058` through `0060`.

## Reference analysis

The live [START Munich homepage](https://www.startmunich.de/) pairs `APPLY NOW` and `JOBS` in the top-right navigation. `JOBS` links to [jobs.startmunich.de/jobs](https://jobs.startmunich.de/jobs), opening a new tab. It is a compact white control with bold uppercase Avenir text in navy, adjoining the recruitment CTA. Its CSS specifies a pink hover treatment; that hover was not exercised.

![Munich's top-right navigation](assets/jobboard-integration/munich-navigation.jpg)

The linked board is a separate Getro interface: its branded navy header leads into a white listing/filter surface. It also includes Companies and Talent features. The reusable reference is the clear Jobs entry point. Berlin's requested migration should lead to its own `/jobs` page in the same tab. Additional Getro features are outside this migration.

- [Linked Munich board screenshot](assets/jobboard-integration/munich-jobboard.jpg)
- [Current v2 homepage screenshot](assets/jobboard-integration/website-v2-before.jpg)
- [Current public Jobboard screenshot](assets/jobboard-integration/public-jobboard-before.jpg)

## Navigation and visual treatment

Extend `src/components/Header.astro`'s existing `ctas` array to render `Apply Now | Jobs`. Preserve `Apply Now`'s `/join` destination. Add `Jobs` pointing to `/jobs`. The component already renders the same CTA array for desktop and the mobile overlay, with a segmented two-pixel gap. Use its existing hover and focus treatment.

Keep v2's Avenir font stack and colors: navy `#00002c`, cyan `#02c3de`, white. Reuse `Layout.astro` and the existing header. Add scoped Jobboard styles, without changing global tokens or the Home, Members and Join layouts.

The listing page should have a compact heading and a short introduction. Place restrained filters above stacked, full-width job rows, using the density of the existing Members controls. Show job title, company and useful location/work/pay information. On mobile, stack the controls and role metadata. Use cyan for small accents and focus states. Provide a discreet `Post a role` link.

The current standalone public app's oversized hero, separate white shell and large employer marketing section do not carry over. The first integration uses the navigation entry as its homepage entry point; a homepage widget is a separate addition if later requested. Preserve an existing embed route only if an active consumer is identified before retiring the source deployment.

## Architecture and reusable code

Copy the versioned Cockpit contract verbatim into `src/lib/jobboard/contracts.ts`, and extend the existing contract comparison check to cover v2. Keep private contacts and editorial notes excluded from public payloads. Reuse the existing formatting, expiry, SEO and submission-security helpers with their meaningful tests.

Adapt the API client for Astro's server context. Remove Next-specific `server-only`, React request caching, `NextResponse` and `after()` usage. Keep scoped Bearer keys in server-only environment configuration. Preserve `no-store`, bounded timeouts, disabled upstream redirect-following, response validation and the existing 2,000-job bound. Broader API filter pagination can remain a later backend enhancement.

Add Astro's React integration for the two interactive islands. The submission form retains React Hook Form, Zod validation and request-ID reuse for retries. Restyle it to v2 instead of changing its conditional compensation or error behavior. Adapt filtering to Nuqs' generic React adapter. Its documented Astro SSR support requires `serverSearch` and a verified version supporting that feature; the source app's pinned 2.8.9 must not be assumed to include it. Pin and test the selected dependency versions during implementation.

Only Jobboard routes load these interactive components. Job details and application redirects are handled by Astro pages/endpoints.

## Route and file map

| Route | Target file | Purpose |
| --- | --- | --- |
| `/jobs` | `src/pages/jobs/index.astro` | Live approved listings and filter island |
| `/jobs/:id/:slug` | `src/pages/jobs/[id]/[slug].astro` | Approved details, canonical slug and closed state |
| `/jobs/submit` | `src/pages/jobs/submit.astro` | Employer submission form island |
| `/api/jobboard/submissions` | `src/pages/api/jobboard/submissions.ts` | Same-origin submission proxy to Cockpit |
| `/jobs/apply/:id` | `src/pages/jobs/apply/[id].ts` | Recheck active status, then redirect to approved URL |
| `/jobs/share/:id/:channel` | `src/pages/jobs/share/[id]/[channel].ts` | Existing WhatsApp/LinkedIn sharing behavior |
| `/jobs/sitemap.xml` | `src/pages/jobs/sitemap.xml.ts` | Active listings only |
| `/jobs/privacy` | `src/pages/jobs/privacy.astro` | Adapted Jobboard processing notice and relevant privacy links |

Components live under `src/components/jobboard/`. Server logic and shared validation live under `src/lib/jobboard/`. Preserve published IDs and slugs. Check whether any public origin or embed URL is already in use before selecting legacy redirects.

## Hosting and configuration

The current v2 configuration is static and has no deployment adapter. Select the adapter for the actual intended host before adding dependencies: `@astrojs/vercel` for Vercel, or the appropriate supported adapter for another host. Use on-demand rendering only for live Jobboard pages and endpoints; existing Home, Members and Join pages stay prerendered.

Configure the Cockpit API URL and independent read and submit keys in the website's server environment. The metrics key is optional while metrics are disabled; configure its separate scoped key only when enabling collection. Canonical and share URLs should use the main website origin. Do not reuse the legacy site's deployment identity or copy its Vercel configuration without checking the target project.

Keep optional request metrics disabled during the initial port, matching the source application's example default. Preserve their contract and existing privacy boundaries. Before enabling metrics, implement an adapter-supported background task lifetime with bounded retries and reused event IDs. Unawaited fire-and-forget promises are insufficient. Preserve submission body limits, same-origin checks, honeypot and rate controls; verify them on the selected runtime.

## Implementation order after plan review

1. Confirm the website hosting target and add only the required server adapter and React-island dependencies. Verify the install/build workflow and resolve the documented existing `MissingSharp` image-build issue before release. Preserve the tracked upstream `dist/` during verification.
2. Port the shared contract and server helpers. Implement live listing/detail pages and safe application redirects against the isolated Cockpit database. Cover approved, closed and unavailable states before adjusting navigation.
3. Restyle and integrate the filter and employer-form islands in v2. Carry over the existing retry, validation and private-field isolation behavior. Make canonical, share and sitemap URLs consistent with the main origin.
4. Add the paired `Apply Now | Jobs` navigation for desktop and mobile. Include a small privacy link within the Jobboard pages. Verify responsive layouts and keyboard behavior against the existing site.
5. Run the complete local journey, then prepare the deployment in order: Newsletter in Cockpit, Jobboard in Cockpit, public pages in v2. Keep the standalone public app available until the migrated flow passes production acceptance. Publishing remains a separate release action.

## Acceptance checks

- Both navigation CTAs work on desktop and mobile; `/join` remains the recruitment destination. Keyboard focus, menu dismissal and narrow-screen overflow checks pass.
- Job search/filter state survives reload and navigation. Reset and load-more work. An empty board is distinguishable from a failed backend request.
- Only approved public snapshots render. Drafts remain private. Old slugs redirect to the current canonical URL. Closed jobs remain readable without an apply action or active `JobPosting` markup.
- The application endpoint catches a job that expires after its detail page was loaded, and never accepts a caller-supplied destination URL.
- A fictional employer submission reaches the isolated Cockpit database as `pending_review`. Retrying the same request does not create a duplicate. Conditional compensation values and field errors behave as in the source app.
- Scoped API keys are absent from HTML and client bundles. Cross-origin and oversized submissions are rejected. Private contacts and review notes never appear in public payloads.
- Job metadata, sitemap entries and share links use the intended main-site origin. Bot/prefetch treatment and optional telemetry are checked if metrics are enabled.
- Production build succeeds using the selected adapter and supported lockfile workflow. Existing Home, Members and Join routes receive a focused regression check.

## Verification performed for this plan

During planning, the standalone public app ran at `http://127.0.0.1:3012`, backed by the isolated local Cockpit server on port 3011 and disposable PostgreSQL on port 55439. Seven fictional roles are visible. Browser verification confirmed listing rendering, a Working Student search result and the corresponding detail page. No browser console errors were recorded in the successful preview. No external application or sharing destination was followed, and no form was submitted.

The v2 homepage was visually inspected at 1280 by 720. The current top-right control is `Apply Now` only. Its existing layout, tokens and CTA structure were checked against the source. Munich's homepage button and its actual destination were inspected read-only. Mobile navigation on the Munich reference was not tested. Implementation was subsequently approved and completed locally. The standalone and v2 previews were stopped at the user's request; temporary verification servers were used for acceptance checks.

## Documentation consulted

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Astro server endpoints](https://docs.astro.build/en/guides/endpoints/)
- [Astro framework components](https://docs.astro.build/en/guides/framework-components/)
- [Nuqs adapters and Astro guidance](https://nuqs.dev/docs/adapters)
- Local `AGENTS.md`, workspace baseline, working plan and existing Newsletter/Jobboard integration brief.

## Current implementation update

The public Jobboard is implemented locally in native Astro routes on `feature/jobboard-integration`. Its current setup and commands are in the [repository README](../../README.md). The official Node adapter runs in standalone mode with on-demand Jobboard pages/endpoints; Home, Members and Join remain prerendered. Sharp is a direct dependency and the integrated image build passes. The hosting target remains a release decision.

Navigation now pairs `Apply Now` with `Jobs` on desktop and mobile. The Jobs hero uses a company-visit photo copied from the preserved asset handoff into the application. A shared icon registry supplies the website's Astro and React components, including company icons and role-sharing controls. The Jobboard has no separate footer. Search, Role type, Location and Working setup remain the listing filters; numbered pagination displays 25 roles per page and preserves page/filter state in the URL.

The employer form uses country-name search and removable chips while retaining the existing ISO-code API payload. Company follow-up copy explains that START contacts the employer to agree publication terms and any referral-based compensation before publication. Commercial terms remain private manual records; pricing and payment collection are not implemented, and Cockpit does not enforce a fee agreement as a publication prerequisite.

Local type/build checks and targeted browser verification are recorded in [the evidence folder](../verification/jobboard-2026-09-29/browser.md). Run the README's checks against the final checkout rather than treating earlier evidence as proof for later changes. Before release, configure the actual host and production service keys, finish the website's general legal/privacy pages, and verify the deployed submission/publication flow. Deploy Newsletter's Cockpit migrations before Jobboard's `0061`. The standalone source remains available until production acceptance. No live deployment or main-branch change is implied by this feature branch.
