Navigation verification, 10 October 2026.

The shared Header adds a direct Events link, Partners with For Partners and Our Partners, and About Us, Member Journey and Jobs under Community. Our Members remains present. Apply Now and Jobs remain inside the open compact menu; the closed header keeps one row. Five new destinations are reserved and have no implemented page content.

The final isolated build at `.astro/navigation-build` was served locally on port 4337. A GET-only local response fixture on port 4340 doubled the root font size without changing application source. Verification used the built application rather than the stale development-server response observed during this task.

| Check | Coverage | Result |
| --- | --- | --- |
| Normal text | 75 route/viewport views across Home, Members, Join, both general legal pages, four Jobs pages/states and the current 404 page | Passed |
| Responsive widths | 320, 390, 768, 1024, 1280, 1440 and 1920 CSS px across all consuming page types; additional Home checks at 639/640 and 1023/1024 | Passed |
| Orientation | Home at 844 × 390 and 1180 × 820 | Passed |
| Enlarged text | 43 views with a 32-pixel root font, including 320-pixel reflow | Passed |
| Menu contents | Labels and hrefs, expanded state, unique panel targets, closed-header CTA visibility and two open-menu CTA destinations | Passed |
| Layout | No horizontal page overflow or navigation outside viewport bounds | Passed |
| Interaction | Ten checks for first/second pointer click, keyboard entry, Escape, focus wrapping, resize closure and local Jobs/Join navigation | Passed |
| Native accessibility tree | Named links/buttons and collapsed/expanded disclosure states; underlying header/main/footer become inert | Inspected |

The design check, Astro typecheck and isolated build pass. The SEO contract check and all nine SEO tests also pass. The existing three Zod deprecation hints remain. This navigation task preserves concurrent SEO work and does not edit dependencies or tracked `dist/`.

Jobs list/detail checks use the controlled unavailable state without Cockpit credentials. Reaching `/jobs` and `/join` verifies local navigation. No external form was submitted, and no application delivery or spoken screen-reader audit is claimed. The current 404 shell includes the shared header; the five reserved destinations remain unimplemented.

[Machine-readable checks](checks.json), [open mobile menu](mobile-open.jpg), [closed mobile header](mobile-closed.jpg) and [desktop dropdowns](desktop-open.jpg) record the result.

The current-source development preview is open at `http://127.0.0.1:4322/`. The temporary built-server and enlarged-text fixture were stopped after verification.
