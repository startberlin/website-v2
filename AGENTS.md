# Agent instructions

## Before editing

- Read [README.md](README.md) and [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md). Inspect the affected shared component.
- Check `git status --short --branch` and preserve existing work.
- Develop in `src/`. `first-draft/` and `design/handoff/` are historical references.
- In the parent START workspace, also read its README, baseline and working plan.

## Commands

Run from the repository root. Use Node.js 22.12+ and the pinned dependencies.

```sh
CI=true pnpm install --frozen-lockfile
ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs dev status
ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs dev --background --host 127.0.0.1
pnpm --config.verify-deps-before-run=false run check:design
ASTRO_TELEMETRY_DISABLED=1 pnpm --config.verify-deps-before-run=false run typecheck
pnpm --config.verify-deps-before-run=false run test:jobboard
ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs build --outDir .astro/design-build
```

Check the existing server and port before starting one. Use `astro dev logs` and `astro dev stop` through the same Node entrypoint. Load local Jobs configuration with `node --env-file=.env`; follow `.env.example`. The pnpm check flag prevents an automatic reinstall.

## UI changes

- Reuse layouts, PageHero, MemberCard and the shared icon registry. Extend with props or slots instead of copying components.
- Define colours, type sizes and radii in `src/styles/tokens.css`. Use `src/styles/primitives.css` for native buttons, fields and focus.
- Keep page layout in scoped Astro CSS. Keep React limited to interactive Jobs islands.
- Update the styleguide alongside intentional design changes. Public UI copy stays English.
- Run the design check, typecheck and an isolated build. Check affected routes at 320, 390, 768 and 1440 px, including keyboard and reduced-motion states. Global changes require all main routes.
- Run Jobboard tests when changing its behaviour. Verify external destinations separately from actual delivery.

## Boundaries

- Preserve tracked `dist/`, existing assets and unrelated local changes. Keep lockfiles unchanged for UI-only work.
- Cockpit owns Jobs data and review. Reuse existing newsletter/subscriber workflows.
- Keep credentials server-side, outside `PUBLIC_` variables and client code. Never commit `.env` or private personnel information.
- `website-raw/` is a separate repository. Do not change it or reuse its deployment configuration without an explicit request.
- Commit, push and release according to the current request. Report the checks performed and any remaining limits.
