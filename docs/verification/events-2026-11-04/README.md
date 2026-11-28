# Events verification, 4 November 2026

The new `/events` page explains START Berlin's events, embeds the public Luma calendar and shows five selected past events.

**Page sections**, in order:
1. A photo hero.
2. Our Event Formats: three formats, each with a photo.
3. Upcoming Events: the reusable [LumaEvents](../../../src/components/LumaEvents.astro) section.
4. Members Only: a card linking to `/member-journey`. There is no application link while applications are closed.
5. Past Events: five cards, each linking to its Luma page, followed by "View past events on Luma".

**What the change adds:**
- the page,
- one reusable component,
- the Luma constants in [luma.ts](../../../src/lib/luma.ts),
- the content module [events.ts](../../../src/data/events.ts),
- nine local images,
- a page-registry entry,
- an optional `phoneShade` prop on the shared PageHero.

All copy comes from the approved content or from the labels approved during the work, and it is server-rendered.

**Environment.** Checks used Node.js v22.23.4, pnpm 11.25.0 and headless Chromium 145.0.7632.6 (Playwright 1.58.2) against isolated local builds.
- **Unchanged:** tracked `dist/`, `package.json`, `pnpm-workspace.yaml`, both lockfiles and `.gitignore`.
- **Not used:** Cockpit credentials, Luma API, Luma login, forms and deployments.
- **External requests:** only ordinary guest page loads of luma.com.

[Full results](checks.json).

**Screenshots:**
- [hero at 1440 px](desktop-1440-hero.jpg)
- [hero at 390 px](mobile-390-hero.jpg)
- [calendar loaded as a guest](desktop-1440-calendar-loaded.jpg)
- [calendar with Luma blocked](desktop-1440-calendar-blocked.jpg)
- [past events with keyboard focus](desktop-1440-past-events-focus.jpg)
- [past events at 390 px](mobile-390-past-events.jpg)

## Automated checks

All run on 4 November 2026 on the final source.

| Check | Result |
| --- | --- |
| `CI=true pnpm install --frozen-lockfile` | Pass, already up to date |
| `check:design` | Pass, 31 stylesheets/blocks, 135 defined custom properties |
| `check:seo` | Pass, 13 HTML route templates |
| `test:seo` | 9 pass. The sitemap tests expect `/events` (16 URLs) |
| `typecheck` | 128 files, 0 errors, 0 warnings, 6 existing hints in `src/content.config.ts` and `src/lib/jobboard/contracts.ts` |
| `test:jobboard` | 47 pass |
| `test:release` | 28 pass |
| `pnpm test` | 104 pass |
| `test:dependencies` | 11 pass |
| `pnpm audit` | No known vulnerabilities |
| Isolated build, `.astro/ci-node` | Pass |
| `smoke:local` on that build | Pass, 10 current pages including `/events`. Jobs returns its controlled unavailable state without Cockpit; this is not backend acceptance |
| `build:vercel`, `.astro/vercel-build` | Pass, `/events` emitted |

## SEO

- **Indexable test build:** built to `.astro/events-indexable` with `PUBLIC_SITE_URL=https://www.start-berlin.com SITE_INDEXABLE=true`; the output is git-ignored and not committed.
  - `/events` returns 200 with the title "Events: founder talks, startup visits and workshops | START Berlin" and the canonical `https://www.start-berlin.com/events`.
  - The robots meta is `index, follow, …`.
  - `sitemap-pages.xml` lists 16 URLs including `/events`, and robots.txt allows crawling.
- **Preview build** (`.astro/ci-node`, `SITE_INDEXABLE=false`): the page renders `noindex, follow`, `sitemap-pages.xml` is empty and robots.txt disallows crawling.
- **Structured data:** only the shared WebPage, WebSite, Organization and ImageObject graph. There is no Event structured data, because upcoming events exist only inside the Luma embed and the past-event cards link to Luma.

**Heading outline:**
- H1 "Events"
- H2 "Our Event Formats", with H3s Founder Talks, Startup Visits and Workshops
- H2 "Upcoming Events"
- H2 "Members Only"
- H2 "Past Events", with one H3 per event inside its card link

## Luma calendar (LumaEvents)

**Probe on 4 November 2026.** A guest context loaded the embed inside a test page served with the shared security headers.

| Sandbox | Result |
| --- | --- |
| None | Loads, 0 console errors |
| `allow-scripts` only | Luma's Cloudflare challenge and data requests fail with CORS errors (opaque origin). The frame still shows "No Upcoming Events", so a broken embed would look like an empty calendar |
| `allow-scripts allow-same-origin` | Loads, 0 errors |
| Shipped set (+ `allow-forms allow-popups allow-popups-to-escape-sandbox`) | Loads, 0 errors |

**What the probe also found:**
- **No auto-height:** Luma sends no `postMessage` to the parent, so the height is reserved in CSS.
- **No failure detection:** the iframe fires `load` even when Luma is blocked, so a failed embed cannot be detected in script.
- **Framing:** Luma sets no `X-Frame-Options` or `frame-ancestors`.
- **Past events:** the embed ignores `?period=past`, and Luma's help page describes calendar embeds for upcoming events only. Past events therefore link to Luma.

**Final build, 1440 × 900, as a guest:**

| State | What shows | Frame | Layout shift |
| --- | --- | --- | --- |
| Loaded | Luma's own "No Upcoming Events / Check back later for new events." | Reserved 720 px | 0 |
| Slow (Luma delayed 6 s) | The status text "The calendar is loading from Luma. You can also view it directly on Luma." | Reserved 720 px | 0 |
| Blocked (Luma aborted) | The status text stays visible and the frame stays transparent | Reserved 720 px | 0 |
| JavaScript off | The frame stays empty | Reserved 720 px | Not measured |

- **In every state:** "View calendar on Luma" is visible and our page logs no console errors.
- **Reserved heights:** 512 px at 320, 675 at 390, 819 at 768, 614 at 1024, 640 at 1280, 720 at 1440, 864 at 1920, 384 on a landscape phone and 656 at 1180.
- **Focus script:** browsers do not match `:focus`, `:focus-visible` or `:focus-within` on an iframe whose content has focus. This was confirmed in Chromium with a cross-origin and a same-origin test frame. The component's script therefore adds `is-focused` to the frame wrapper when Tab moves focus into the embed. It only toggles that class; it uses no `innerHTML`, storage, `postMessage` or network requests.
  - With a keyboard, Tab into the frame shows the shared 2-px outline, and Tab out or Shift+Tab updates it.
  - A mouse click into the frame shows no outline.
- **Lazy loading:** at 390 px Chromium requested the embed before the section was scrolled into view. This is Chromium's iframe lazy-loading distance; the attribute is set.

## Shared PageHero

**The prop:** `phoneShade` is optional and off by default. It adds one `--surface-status` layer below 640 px, and only Events uses it. It was added because on phones the long hero description runs over name badges and the winner board.

**Contrast measured while choosing:**
- Mock-ups without the shade gave a worst pixel of 4.45:1 at 320 px.
- With the shade the worst pixel was at least 9.1:1.

**Regression check on the final build:**
- **Pixels:** Home, Join, Members, Jobs, 404 and Member Journey match a baseline built from `a630633` (before the change) pixel for pixel at all nine viewports: 54 of 54. The capture scrolls through each page and decodes all images first; an earlier capture without that step was non-deterministic on the same build.
- **HTML:** on those routes only the two new rules in PageHero's inlined stylesheet differ. `/jobs`, which loads the CSS externally, is identical.

## Browser verification

**Viewports.** 320 × 640, 390 × 844, 768 × 1024, 1024 × 768, 1280 × 800, 1440 × 900, 1920 × 1080, 844 × 390 and 1180 × 820, each with JavaScript on and off (18 views).
- Every view returns 200, has one H1, no horizontal overflow, no element outside the viewport and no console or page errors.
- All nine images load with alt, width and height. The graphics' empty alt renders as a bare `alt` attribute.
- **Formats:** one column below a 40-rem container. Photo beside the text at 768 px, 1024 px and on the landscape phone. Three columns from 1180 px.
- **Past events:** one column at 320 and 390 px. Two columns at 600 px (an earlier pass on this layout). Three columns at 768 px, 1024 px and on the landscape phone. Five columns from 1180 px.
  - Cards are 204–398 px wide.
  - At 2× density Chromium selects the 800-px graphic at every width, which covers the largest need of 796 px.
  - No title is truncated.

**Hero contrast.** Measured as the worst single pixel behind each text line on the rendered page, with the text hidden.
- **Description** (`--text-copy`): at least 7.39:1, lowest at 768 × 1024; 8.71:1 at 320 px.
- **Title:** at least 11.85:1.

**Text contrast on token surfaces** (calculated with alpha blending):

| Text | Ratio |
| --- | --- |
| Card titles | 19.27:1 |
| Card dates and calendar status | 9.48:1 |
| Calendar link | 9.52:1 |
| Members card text | 9.09:1 |
| Format text | 9.72:1 |

**Enlarged text.** Tested with a 32-px root font, a controlled 200% text check rather than operating-system zoom. At 320, 768 and 1280 px: no horizontal overflow, no element outside the viewport, no clipped text.

**Keyboard** (1440 × 900 and 390 × 844).
- From the H1, `main` has nine tab stops: "View calendar on Luma", the calendar frame, "Explore the Member Journey", one stop per past-event card (5 for 5) and "View past events on Luma".
- Every stop shows the 2-px cyan outline below the sticky header.
- Each card link's accessible name is its title, date and "(opens in a new tab)".
- Touch targets are at least 44 px high.

**Reduced motion.** With `prefers-reduced-motion: reduce` emulated, no element in `main` has a transition or animation. Nothing moves on its own.

**Header.** The existing Events link (`/events`) resolves with 200. No Header code changed; two destinations, About Us and Partners, remain reserved.

**Server-rendered HTML.**
- All text, both Luma links and the five past-event cards are in the initial HTML.
- No HTML comments.
- Every `target="_blank"` link has `rel="noopener noreferrer"`.
- The only `data-*` attributes are functional hooks: Astro scope IDs, the shared Header and PageHero hooks, the outline hook and the security-policy digest.

## Images and rights

**Event photos** (hero and three formats).
- Cropped from the supplied originals with the existing `sharp`.
- The hero is committed at 2400 × 944 and the format photos at 16:10: 1179 × 737 and 1600 × 1000.
- **Hero:** at full original resolution a name badge was legible. At the committed size no badge text is legible. A half-cut face at the right edge was cropped out.
- **Workshops:** cropped below the TV's tab bar, bookmarks, address bar and dialog heading. Only faint generic button labels remain, which the page owner accepted. The laptop screens are illegible.
- **Founder Talks:** the source was also portrait and was cropped to 16:10.

**Past-event graphics.**
- The five 800 × 800 graphics are identical to the events' Luma covers (mean difference 0.4–0.6/255).
- **The page owner confirmed on 4 November 2026** that they are START Berlin's own graphics and that START Berlin has the rights to use them, including the runner photo and the partner logos (Qonto, Red Bull, Lexora, The Democratic Spin, Aniva).
- They are committed at native size, square and uncropped.
- On the April graphic, a partly legible name badge was blurred in a 54 × 38 px area only (σ 2) and is unreadable at 100% and 400%. The other four files are unchanged copies.

**Past-event data.** Each event's title, date, location and URL were confirmed on its own Luma page (guest view, no login) on 4 November 2026.
- The 🚀 was dropped from the April title.
- For the run and the Procuros visit, the public list says "Mitte" while the event pages show guests only "Berlin". The site stores "Mitte" as specified, but the location is not displayed.
- No attendee counts are used.

**Metadata.** The nine committed JPEGs and every WebP file the build emits contain no EXIF, XMP, IPTC, ICC or JFIF data. Astro emits WebP only, with no copies of the originals.

## Deviations from the plan

All the changes below were made with the page owner's approval.

- **Section order:** Hero, Our Event Formats, Upcoming Events, Members Only, Past Events.
- **Visual elements:** no icons, badges or decorative effects anywhere. The members-only card is set apart only by the featured Testimonial surface and border.
- **Past events:** the section was planned as a link only. It became five linked cards with the confirmed START Berlin graphics, and the link to all past events stays below them.
- **Focus script:** LumaEvents has a small focus script, which the plan ruled out; it is needed for visible keyboard focus (see above).
- **PageHero:** gained `phoneShade` (option A).
- **Props:** LumaEvents takes `lead` as a string prop and has no `headingOutline`.
- **Luma constants:** `src/lib/luma.ts` was added in step (a) rather than (b), because the past-events link needs it.

## Not verified

- **Guest registration.** No public upcoming event was listed on Luma on 4 November 2026, so registration inside the embed was not tested. The `allow-forms`, `allow-popups` and `allow-popups-to-escape-sandbox` tokens are expected for registration and Luma sign-in but are unconfirmed. Remove any the flow does not use.
- **Forcing Luma's language.** The page owner observed the embed showing German interface text ("Keine bevorstehenden Events") in a German-language browser, so Luma's interface follows the visitor's browser language. Whether it can be forced to English, so that it matches the English page, was not checked. The automated checks used the default English locale.
- **Populated calendar.** The frame height was only seen with Luma's empty state, not with listed events.
- **Browsers and devices.** Only Chromium was tested: no Safari, Firefox, real phones or tablets, and no operating-system zoom.
- **Screen readers.** No spoken screen-reader audit; names and roles were checked in Chromium's accessibility tree.
- **Production.** No production or preview deployment, live indexing, Search Console or field Core Web Vitals.
- **Hero crop at about 768 px.** The wide group photo is cropped at its sides there, so an edge person can be partly cut. Faces were checked at 320, 390, 1024, 1440 and 1920 px.

## Security (SECURITY.md §19)

1. **Scope reviewed.**
   - **Date and coverage:** 4 November 2026, the Events page, LumaEvents with its third-party iframe and focus script, the PageHero prop, the content module, nine images, the page-registry entry and the documentation.
   - **What it is:** a static, prerendered page with one small progressive-enhancement script and one third-party iframe.
   - **§0A.9 applies:** the branch creates or modifies 27 files, counting this folder.
   - **Sections that apply:** secrets and configuration; output encoding and XSS; transport, headers and browser security (iframe sandbox, `target="_blank"`); third-party embeds; supply chain; data protection for images and third parties.
   - **Not applicable, because the page has none of these:** authentication, sessions, access control, forms and input validation, file uploads, payments, APIs and webhooks, database, rate limiting, LLM features.
2. **Security measures implemented.**
   - **Iframe sandbox** in [LumaEvents](../../../src/components/LumaEvents.astro): `allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox`.
     - Script and same-origin were proven necessary.
     - Combining them is safe here because Luma is cross-origin; the sandbox escape only applies to same-origin content.
     - Still blocked: top-level navigation of this page, downloads, modal dialogs, pointer lock and presentation.
   - **No `allow` attribute:** no device permissions are delegated; Permissions-Policy already disables camera, microphone and geolocation. **No `referrerpolicy`:** the site's `no-referrer` applies.
   - **New-tab links:** all seven new `target="_blank"` links use `rel="noopener noreferrer"` (the calendar link, five cards, the past-events link).
   - **Output encoding:** all content is rendered through Astro expressions, with no `set:html`, `innerHTML`, `eval` or dynamic script sources. The focus script only toggles one class.
   - **No added external code** beyond the Luma iframe: no external scripts, fonts or stylesheets, and no new dependencies.
   - **Security headers:** unchanged (`src/lib/security` is identical to `main`), so the policy digest is unchanged.
   - **Image privacy:** all images carry no metadata. Badge text is illegible (hero) or blurred (April graphic), and the TV's browser tabs are cropped out (workshops).
   - **Rights:** the page owner's confirmation is recorded above.
3. **Checks performed** (local builds only; no third-party system was tested beyond ordinary guest page loads).
   - **Grep of the added lines in the branch diff** against `main`: no `innerHTML`, `outerHTML`, `set:html`, `eval`, `new Function`, `document.write`, `postMessage`, storage, `fetch`, `XMLHttpRequest`, environment access, `PUBLIC_` variables, `http://` URLs, keys, secrets, tokens, passwords or private keys. The only matches are the STYLE_GUIDE sentence stating that the script uses no `innerHTML` or `postMessage`.
   - **Secret scanner:** none (gitleaks, trufflehog) is installed, so only that grep was run. `.env` is not tracked.
   - **Dependency audit:** `pnpm audit`, no known vulnerabilities; no package or lockfile changed.
   - **Header contract:**
     - `test:release` (28 pass).
     - `smoke:local`, which covers the security headers on 10 pages including `/events`, static aliases, malformed URLs, HEAD and 304.
     - A direct header check of `/events` on the built server.
   - **Embed behaviour:** the sandbox probe and the blocked-embed test described above.
   - **Built HTML:** checked for HTML comments, `data-*` attributes and new-tab `rel` values (results under Browser verification).
4. **Fixed.** No security defect was found in the new code, so nothing needed fixing. The keyboard focus fix is an accessibility fix.
5. **Not fixed / needs human action.**
   - **Low: confirm the sandbox with a real guest registration** once a public event is listed. Remove unused tokens; if Luma needs another token, add only that one.
   - **Medium: privacy disclosure.** The embed loads luma.com and Cloudflare's challenge when the section nears the viewport, which shares the visitor's IP address and user agent with Luma. In the empty state the probe saw no cookies or localStorage; this was not checked with events or registration. The legacy privacy policy still names Webflow (see README). Before release, the privacy policy should be reviewed to cover Luma, and a decision taken on whether the embed needs consent or a click-to-load step. This is a legal and owner decision.
6. **Residual risks and recommendations.**
   - **Third-party content:** Luma's content inside the frame is outside START Berlin's control. The sandbox limits what it can do to this page.
   - **Future CSP changes:** if the CSP gains `frame-src` or `default-src`, it must include `https://luma.com`. Adding `Cross-Origin-Opener-Policy: same-origin` could break popups opened from the frame and needs a registration re-test.
   - **Inline scripts:** the focus script is an inline module script, like Astro's existing scripts. It relies on the current policy, which deliberately allows them and is not nonce- or hash-based (SECURITY.md, "Website implementation").
   - **Re-audit** when the embed URL, the sandbox, the security headers or the past-event graphics change.

No system can be proven secure; the list above states what was tested and what remains.
