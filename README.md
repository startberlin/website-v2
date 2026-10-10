# START Berlin website v2

Development continues on `main`, based on the existing Astro website. The Cockpit-backed Jobboard and member-directory improvements were merged through [PR #1](https://github.com/startberlin/website-v2/pull/1) on 30 September 2026. The source now includes shared photo heroes and researched member profiles. See [implementation notes and verification](docs/members-and-heroes.md). Production configuration remains part of the release scope below.

Home, Members and Join remain prerendered. Jobboard listings and details render on demand through the Node adapter. Employer submissions go into Cockpit's private review queue. The public website has no database connection and keeps service keys on the server. Shared Astro/React icons are used across the website.

## Design and contributor onboarding

Read [AGENTS.md](AGENTS.md) and the [design guide](docs/STYLE_GUIDE.md) before UI changes. Use [tokens.css](src/styles/tokens.css) for visual values and [primitives.css](src/styles/primitives.css) for native controls. Run `pnpm --config.verify-deps-before-run=false run check:design` to detect style drift.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the PR workflow and [docs/RELEASE.md](docs/RELEASE.md) for staging, production and domain cutover. GitHub `main` and `production` require successful checks and one admin authorization, through review or intentional PR merge, including on the admin's own PR. Production uses that release-PR authorization without a second environment approval.

Activation verified on 10 October 2026: the new [Vercel project](https://vercel.com/start-berlin/website-v2) deploys reviewed main source to [staging.start-berlin.com](https://staging.start-berlin.com), with individual PR previews after CI. Both use public preview configuration and block indexing. Individual generated Preview URLs retain Vercel Authentication; the fixed staging domain is accessible without a Vercel login. The project-scoped START Website CI credential is stored in the protected GitHub deployment environments. Source uploads require no Vercel Git connection or personal GitHub sign-in in the shared START account. The complete team flow is on [Website v2 Overhaul](https://app.notion.com/p/3f5dec9cfc2780c0b715cac4e447bc3b).

Production publication stays disabled until backend/product acceptance and the approved first domain cutover. The existing live website remains on its legacy project. Do not treat a controlled Jobs-unavailable preview as backend or form-delivery acceptance.

## Local setup

Use Node.js 22.13 or newer and pnpm 11.25.0. CI and Vercel use Node.js 22. Install with the pinned pnpm lockfile, then create a private local configuration:

```sh
pnpm install --frozen-lockfile
cp .env.example .env
```

Set `COCKPIT_API_URL` to the running Cockpit API prefix. Set distinct `JOBBOARD_READ_API_KEY` and `JOBBOARD_SUBMIT_API_KEY` values matching Cockpit, each at least 32 characters. Set `PUBLIC_SITE_URL` to the website's exact origin, without `/jobs`. Keep request metrics disabled. Never expose these keys through `PUBLIC_` variables or client code.

The server reads runtime environment variables. Start development with the local file explicitly loaded:

```sh
node --env-file=.env node_modules/astro/bin/astro.mjs dev --background --host 127.0.0.1
pnpm exec astro dev status
pnpm exec astro dev logs
```

Open `http://127.0.0.1:4321/jobs`. Check the existing background-server status before starting another process. Use `CI=true` for unattended pnpm commands. Keep npm and pnpm lockfiles coherent and use one package manager per installed dependency tree.

## Checks and built-server preview

```sh
pnpm run typecheck
pnpm run test:jobboard
pnpm exec astro build --outDir .astro/jobboard-build
HOST=127.0.0.1 PORT=4337 node --env-file=.env .astro/jobboard-build/server/entry.mjs
```

The separate verification output preserves the tracked upstream `dist/`. Serve the generated Node entrypoint with its client assets; uploading static HTML alone does not provide the live Jobboard routes. Production variables must be supplied by the host. Built output does not automatically load `.env`.

## Scope and release requirements

Navigation pairs `Apply Now` (`/join`) with `Jobs` (`/jobs`). The Jobboard includes filters with 25-role URL pagination, canonical detail pages, employer submissions, application/share redirects and an active-role sitemap. The shared website footer appears on all pages, including Jobs. It links to `/legal-notice` and `/privacy-policy`, which preserve the legacy Berlin texts in the START Munich layout. Legacy `/legal/*.html` URLs redirect to these pages. Donate is present but disabled until a donation destination is provided. See the [approved plan and implementation update](docs/plans/2026-09-29-jobboard-integration.md) and [local verification evidence](docs/verification/jobboard-2026-09-29/browser.md).

Release Newsletter in Cockpit before Jobboard. Newsletter owns migrations `0058` through `0060`; Jobboard follows with `0061`. The public migration requires no database-provider reconfiguration. Keep the standalone public project until the deployed v2 flow passes acceptance.

Production API credentials and backend acceptance remain to be configured. The Node adapter provides local built-server previews; `pnpm run build:vercel` uses the official Vercel adapter and isolated output. Before release, reconcile the migrated legal/privacy text with the actual hosting and services; the legacy privacy policy still names Webflow. Request analytics are disabled.

START plans to agree compensation with each company before publication; a referral arrangement remains a possibility. Staff follow up manually using the private Cockpit contact, record agreed terms, then review and publish the draft. Pricing is not settled. Commercial agreement enforcement and billing are not implemented.
