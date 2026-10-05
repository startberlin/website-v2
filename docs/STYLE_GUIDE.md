# Design guide

## Shared components

| Component | Use |
| --- | --- |
| [Layout](../src/layouts/Layout.astro) | Every page's HTML shell, global styles and Header. One `main` per page. |
| [PageHero](../src/components/PageHero.astro) | Photo hero with one `h1`. Use `title`, `description`, `actions` and `aside` slots; pass crop positions as props. Home and Jobs extend it. |
| [MemberCard](../src/components/MemberCard.astro) | Member presentation. Preserve the badge on the portrait edge and the LinkedIn touch target. |
| [Icons](../src/components/icons/) | Astro/React wrappers share `src/lib/icons.ts`. Add icons there. |
| [JobboardLayout](../src/layouts/JobboardLayout.astro) | Jobs shell and metadata. Reuse the existing CountryPicker and pagination. |

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

Use the `--text-*` scale: 16 px for body/inputs, 14 px for labels/buttons and at least 12 px for new metadata. Use central `--type-*` tokens for display headings. Existing compact text sizes remain specific exceptions. Use `rem` and preserve browser zoom.

Use `.page-container` for every page-content region, including navigation, heroes and footer. All routes share `--layout-page`: at most 80 rem of usable content, centred with `--page-gutter` margins of 16 px, 24 px from 640 and 32 px from 1024. Never add another horizontal inset or page-specific width. Reading/form limits stay inside this container; background images may span the viewport. Use `--space-*` for the 4-px spacing rhythm.

Allow long text to wrap. Keep `min-width: 0` on flexible children. Avoid fixed card heights and page-wide overflow hiding. Keep optical badge positioning and photo crops local and documented.

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
