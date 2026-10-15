# Agent instructions

## Before editing

- Read [README.md](README.md) and [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md). Inspect the affected shared component.
- Read [docs/SECURITY.md] for the security guidelines and practices to follow.
- Read [docs/SEO.md](docs/SEO.md) before adding or changing pages, metadata, public URLs or crawler rules.
- Check `git status --short --branch` and preserve existing work.
- Develop in `src/`. `first-draft/` and `design/handoff/` are historical references.
- In the parent START workspace, also read its README, baseline and working plan.

## Commands

Run from the repository root. Use Node.js 22.13+ within 22.x and the pinned dependencies. Keep the package engine's major aligned with CI and the Vercel project; hosted health and packaged-function checks reject a runtime mismatch.

```sh
CI=true pnpm install --frozen-lockfile
ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs dev status
ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs dev --background --host 127.0.0.1
pnpm --config.verify-deps-before-run=false run check:design
pnpm --config.verify-deps-before-run=false run check:seo
pnpm --config.verify-deps-before-run=false run test:seo
ASTRO_TELEMETRY_DISABLED=1 pnpm --config.verify-deps-before-run=false run typecheck
pnpm --config.verify-deps-before-run=false run test:jobboard
ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs build --outDir .astro/design-build
```

Check the existing server and port before starting one. Use `astro dev logs` and `astro dev stop` through the same Node entrypoint. Load local Jobs configuration with `node --env-file=.env`; follow `.env.example`. The pnpm check flag prevents an automatic reinstall.

## UI changes

- Reuse layouts, PageHero, MemberCard and the shared icon registry. Extend with props or slots instead of copying components.
- Define colours, type sizes and radii in `src/styles/tokens.css`. Use `src/styles/primitives.css` for native buttons, fields and focus.
- Use `.page-container` for consistent content width and horizontal edges on every route. Keep narrower reading/form limits inside it.
- Keep page layout in scoped Astro CSS. Keep React limited to interactive Jobs islands.
- Update the styleguide alongside intentional design changes. Public UI copy stays English.

## Verification

- Run the design check, typecheck and an isolated build for UI changes.
- Every component must look correct and remain accessible on phones, tablets and desktops. Test affected components in all relevant states using the [verification matrix](docs/STYLE_GUIDE.md#verification).
- Shared/global changes require every consuming route. Fix visual and accessibility failures before marking UI work complete; record tested viewports and states.
- Run Jobboard tests when changing its behaviour. Verify external destinations separately from actual delivery.

## Contribution and release

- Follow [CONTRIBUTING.md](CONTRIBUTING.md). Work on a feature branch and open a PR to `main`; wait for Required checks and one repository-admin approval. An admin can authorize their own PR by intentionally merging it after review. GitHub cannot record a separate Approve review from the PR author.
- AI assistance does not replace reviewing the full diff or exercising the affected flow. Record actual evidence and incomplete verification in the PR.
- `main` feeds staging; only the reviewed `main`-to-`production` release PR feeds production. One admin approves that release PR. There is no second deployment approval.
- Follow [docs/RELEASE.md](docs/RELEASE.md). CI validates both Node and Vercel output. Never publish tracked `dist/`, bypass the technical rules, auto-merge releases or move live domains as part of an ordinary feature PR. Admin review authorization applies only to PR merges; CI and resolved discussions stay mandatory.
- Keep deployment credentials out of PR checks. After successful CI, same-repository PRs receive a preview with no shared Cockpit credentials. Contributors with Write access may request a fresh preview.

## SEO and AI search

- Every HTML route must use the shared Layout, directly or through LegalLayout/JobboardLayout, and pass `seo` from `pageSeo()` in `src/lib/seo/pages.ts`. Register new routes there; indexable entries join the sitemap automatically. Dynamic templates must derive their title, description and canonical path from the public record.
- `src/components/SEOHead.astro` alone owns titles, descriptions, canonicals, robots, social cards and JSON-LD. Extend its typed contract instead of adding duplicate head tags. Keep one descriptive H1 and crawlable links; essential content must be available in the initial HTML.
- Use `PUBLIC_SITE_URL` consistently at build and runtime. Keep `SITE_INDEXABLE=false` for local development and previews. Enable it only for an approved production release; regenerate static output when changing it. Prerendered HTML cannot be repaired with a runtime flag alone.
- Keep sitemap entries canonical and public. Exclude errors, utilities, private forms, filtered Jobs URLs and closed/expired roles. Never invent last-modified dates. Preserve honest 404/503 statuses and permanent redirects for changed URLs.
- Structured data must describe published facts and visible content. Escape it with the shared serializer. Add Article/Event/Breadcrumb data only when its actual content exists. No invented dates, reviews, statistics, locations or language alternatives.
- Preserve image dimensions, responsive delivery and above-the-fold priority. Use shared public search/social assets or an approved page-specific raster with dimensions and alt text. Keep AI search crawlers permitted in production; search access and model-training permission are separate decisions.
- Run `check:seo`, `test:seo`, typecheck and an isolated build. The SEO inventory guard also runs on every Astro build. Verify actual HTML, sitemap XML, robots.txt, redirects and error/preview states. Report live indexing and Core Web Vitals only after production measurement.

## Boundaries

- Use the shared START Vercel account for this project. Never connect or transfer Jannik's personal GitHub sign-in to a shared START account. Verify the destination account before any OAuth/login-link action.
- V2 uses source uploads from GitHub Actions with the START Vercel project/team IDs and deployment token. Keep its Vercel Git connection absent. A public repository does not need a personal GitHub sign-in to Vercel.
- Preview configuration contains public values only. Test private service integrations on the prepared Production candidate before assigning live domains; do not depend on branch-specific secrets in a disconnected Git project.
- Preserve tracked `dist/`, existing assets and unrelated local changes. Keep lockfiles unchanged for UI-only work.
- Cockpit owns Jobs data and review. Reuse existing newsletter/subscriber workflows.
- Keep credentials server-side, outside `PUBLIC_` variables and client code. Never commit `.env` or private personnel information.
- `website-raw/` is a separate repository. Do not change it or reuse its deployment configuration without an explicit request.
- Commit, push and release according to the current request. Report the checks performed and any remaining limits.
