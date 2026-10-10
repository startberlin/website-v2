# Design guide

## Shared components

| Component | Use |
| --- | --- |
| [Layout](../src/layouts/Layout.astro) | Every page's HTML shell, global styles, Header and Footer. Requires `seo` from the [page registry](../src/lib/seo/pages.ts). One `main` per page; the footer is outside it and sits at the bottom on short pages. |
| [SEOHead](../src/components/SEOHead.astro) | Search/social metadata and JSON-LD for every layout. Follow the [SEO contract](SEO.md); register routes instead of copying head tags. |
| [Header](../src/components/Header.astro) | Shared navigation with one header row. In the compact layout, Apply Now and Jobs appear inside the open menu. Desktop links and CTAs appear when the navigation container reaches 64 rem, so enlarged text retains the compact layout. Community contains About Us, Our Members, Member Journey and Jobs. Events is a direct link. Partners contains For Partners and Our Partners. Disclosures expose `aria-expanded` and `aria-controls`; controls have a 44-px minimum height. The open mobile menu makes the underlying header bar, main and footer inert. Five destinations remain reserved until their pages exist. |
| [Footer](../src/components/Footer.astro) | Site-wide legal and legacy Berlin social links. Optional `donationUrl`; without it Donate is disabled with no secondary status text. Three areas in a wrapping row from 768 px, stacked below. Enlarged text may wrap the row. Mobile navigation makes the footer inert. |
| [LegalLayout](../src/layouts/LegalLayout.astro) | Visible `title`, required `seo` and a content slot. One H1; semantic H2/H3/H4 for the migrated text. Uses the shared page container. Long URLs wrap. |
| [PageHero](../src/components/PageHero.astro) | Photo hero with one `h1`. Use `title`, `description`, `actions` and `aside` slots; pass crop positions as props. Home and Jobs extend it. |
| [MemberCard](../src/components/MemberCard.astro) | Member presentation. Preserve the badge on the portrait edge. Optional LinkedIn and START email links share a centered row below the role, with 18-px icons and separate 44-px touch targets. Contact links wrap at enlarged text sizes and use shared focus styles. The directory keeps an 8-rem minimum card width and a scroll offset below its sticky filters for keyboard focus. |
| [BoardProfile](../src/components/BoardProfile.astro) | Board-only detail view without breadcrumbs or quotes. At a content width of 60 rem the portrait and CV category labels share the left column. A 256-px portrait stays below the shared header while the introduction scrolls beside it, then releases before Experience enters its column. CV entries remain on the right. Narrow layouts, enlarged text and viewports at most 600 px high keep the portrait in normal flow. One H1 and visible contacts. Experience includes selected projects; Education and Volunteering use the same plain rows with title, organisation, optional period and link. No CV descriptions or education notes. Missing entries stay explicit. The bottom "Back to the Members" link opens `/members`. |
| [Icons](../src/components/icons/) | Astro/React wrappers share `src/lib/icons.ts`. Add icons there. |
| [JobboardLayout](../src/layouts/JobboardLayout.astro) | Jobs shell forwarding the required `seo` to Layout. Reuse the existing CountryPicker and pagination. |

Search for an existing component before adding one. Extend repeated UI with props, slots or a named variant. Share behaviour through components; keep domain data in its existing source.

## Tokens and native controls

[Tokens](../src/styles/tokens.css) own visual values. [Primitives](../src/styles/primitives.css) own buttons, text fields and focus. Both load through `global.css`; local CSS handles layout.

| Colour role | Token |
| --- | --- |
| Navy background `#00002c` | `--color-dark-blue` |
| Cyan accent `#02c3de` | `--color-accent` |
| White | `--color-white` |
| Body / secondary / supporting text | `--text-copy` / `--text-muted` / `--text-subtle` |
| Card / field surfaces | `--surface-card` / `--surface-control` |
| Decorative / field borders | `--border-subtle` / `--border-control` |
| Errors | `--color-error` |

Use semantic tokens rather than new colour literals. Necessary field boundaries need stronger contrast than decorative dividers. Keep text at 4.5:1 and essential control indicators at 3:1 against their actual background.

| Radius | Purpose |
| --- | --- |
| `--radius-control`: 4 px | Buttons, pagination and compact icon tiles |
| `--radius-field`: 8 px | Text fields and filter containers |
| `--radius-card`: 12 px | Content cards and dropdowns |
| `--radius-media`: 16 px | News image cards |
| `--radius-pill` | Badges, chips and avatars |

```html
<a class="button" href="/join">Apply now</a>
<a class="button button--outline" href="/members">Our members</a>
<button class="button" type="submit">Submit role</button>
<label for="email">Email</label>
<input class="ui-control" id="email" name="email" type="email" autocomplete="email" />
```

Existing `jb-button` and field selectors are aliases of these primitives. Join's uppercase CTA is an explicit variant. Do not create separate Astro and React styling systems.

## Typography and layout

Use `--font-sans`, the existing Avenir stack. No webfonts are bundled; device fallback must be checked before claiming identical typography.

Use the `--text-*` scale: 16 px for body/inputs, 14 px for labels/buttons and at least 12 px for new metadata. Use central `--type-*` tokens for display headings. `--type-legal-title` follows the START Munich reference at 36 px, then 48 px from 768. Footer labels use `--tracking-wide` at 0.1 em. Legal body copy uses the existing 18-px `--text-lg` role. Existing compact text sizes remain specific exceptions. Use `rem` and preserve browser zoom.

Use `.page-container` for every page-content region, including navigation, heroes and footer. All routes share `--layout-page`: at most 80 rem of usable content, centred with `--page-gutter` margins of 16 px, 24 px from 640 and 32 px from 1024. Never add another horizontal inset or page-specific width. Reading/form limits stay inside this container; background images may span the viewport. Use `--space-*` for the 4-px spacing rhythm.

Allow long text to wrap. Keep `min-width: 0` on flexible children. Avoid fixed card heights and page-wide overflow hiding. Keep optical badge positioning and photo crops local and documented.

The Members board uses two separate card rows: President, Vice President and Head of Finance first, then the remaining board members. The rows use the same card sizing as the departments and wrap independently on narrow screens. No additional leadership label is shown. An optional `profileUrl` gives Board members a stretched card link with a visible focus outline; contact links remain independent targets above it. Only current Board members receive profile routes, including links from their department cards.

Members filters switch to one row when their container reaches 40 rem. This preserves the search field with enlarged text instead of shrinking it to zero. Below 600 px viewport height the filter bar scrolls with the page, leaving the content reachable in landscape. A ResizeObserver and resize handler measure the sticky filter bar for the route's keyboard/anchor scroll offset, so wrapping and orientation changes keep focused cards below the visible sticky bars.

Board details use `--type-member-name` and `--tracking-member-name`. Portraits keep their existing square crop and never request pixels beyond the 256-px source. The portrait's sticky parent spans only the introduction so the photograph leaves at least the following section's padding before the left CV labels. Its top offset uses `--header-height` plus `--space-10`. Extra reading width stays inside the common page container. Projects with the same URL as an existing experience entry are shown once. Projects & interests is not a separate section. The complete quote block is removed, including its labels and placeholders; Jannik's model-ranking entry is omitted at his request. His Founder period follows LinkedIn. All profile content is server-rendered; no profile-specific client JavaScript is needed. Profiles have no visible breadcrumbs and therefore publish no breadcrumb schema. Public profiles with an introduction can join the production sitemap; previews remain noindex.

## UX and accessibility

- Use links for navigation and buttons for actions. Label fields and icon-only controls.
- New touch controls need 44 × 44 px. Shared focus is 2 px Cyan with a 4-px offset.
- Preserve input on errors. Connect hints/errors to fields; show success only after API confirmation.
- Define loading, empty and failure states. Preserve Jobs URL filters and pagination through reload/Back.
- Respect reduced motion. Ongoing animation needs pause/stop; list transition properties explicitly.
- Use local Astro image assets, reserved dimensions and meaningful alt text. Check photo crops and overlay contrast.
- Meet [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). Verify keyboard access, visible/unobscured focus and screen-reader names, states and announcements. Check 200% text zoom and reflow at 320 px.

## Verification

Every component must look correct and remain accessible across device sizes. Test all affected components in their relevant default, focused, open, loading, empty, error, success and disabled states.

| Device | Minimum test widths (CSS px) |
| --- | --- |
| Smartphone | 320, 390 |
| Tablet | 768, 1024 |
| Desktop | 1280, 1440, 1920 |

Check portrait and landscape on phones/tablets. Resize between sample widths and test both sides of affected breakpoints. At every size, verify matching left/right content edges across routes, readable text and usable controls without clipping, overlap or horizontal page overflow. Check image crops.

Run `check:design` and the checks in [AGENTS.md](../AGENTS.md). Combine automated checks with manual visual, keyboard and screen-reader checks. Fix failures before completion and record the tested widths, states and results.

Existing follow-ups: a shared skip link, complete motion/keyboard controls on the homepage, font delivery and the multi-season keyboard pattern.
