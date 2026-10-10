# Contributing

## One change, one PR

Start a feature branch from current `main`. Explain the problem, keep the diff bounded and open a PR to `main`. Direct pushes to `main` and `production`, force pushes and branch deletion are blocked. Admins follow the same branch rules.

An independent repository admin reviews the latest feature commit. CODEOWNERS currently lists the verified repository admins: `jannikbln`, `zunkelty`, `ahaMfM` and `DieProgrammIDE`. A changed role requires updating the owner list; deployment guards reject a code owner who is no longer an admin. Read access or an ordinary approval from another contributor does not satisfy the code-owner rule.

New commits dismiss stale reviews. Resolve review discussions and wait for Required checks before merging. Do not ask someone to approve an earlier version and then add unreviewed changes.

## Working with AI

Read AGENTS.md and the existing code before prompting an agent to edit it. Ask for a bounded change with observable acceptance criteria. Extend the current Astro components and data contracts. Follow the styleguide for UI work.

Review the entire diff yourself. Check new packages against their official documentation and pin versions. Keep secrets server-side, and use synthetic data for local fixtures. Do not paste private member assessments or credentials into prompts, screenshots or PR bodies. An agent's summary is not evidence that a form was delivered or that a deployment is live.

Run the affected behaviour and record what you actually checked. Add tests for changed contracts or failure paths; avoid tests that merely repeat implementation details. Changes to shared UI require the styleguide's consuming-route and responsive checks. Preserve unrelated work from other contributors.

## Local verification

Use Node.js 22 and the pnpm version in package.json. Keep both lockfiles coherent when changing dependencies; otherwise leave them alone.

```sh
pnpm install --frozen-lockfile
pnpm run check:design
pnpm run typecheck
pnpm run test:jobboard
pnpm run test:release
pnpm exec astro build --outDir .astro/ci-node
pnpm run smoke:local -- .astro/ci-node
pnpm run build:vercel
```

These checks use no production credentials. The local smoke server uses an available loopback port, clears Cockpit keys and shuts itself down. A controlled Jobs 503 is valid for this isolated test and does not establish backend acceptance.

CI repeats design/type checks, behaviour tests, both builds and workflow validation. Its final Required checks job fails if any dependency fails or is skipped. Documentation-only PRs still run CI so the required status cannot remain pending through a path filter.

PR previews are requested by an admin through the Deploy PR preview workflow after CI succeeds. Each gets its own deployment URL. The fixed staging domain shows the latest successfully tested `main`, not every open PR at once. Vercel's deployment list is the overview of those individual previews.

## Releasing

After merge, staging validates the exact source before assigning its domain. The release bot opens a `main`-to-`production` PR only after staging succeeds. One admin approves that release PR, including Jannik. There is no second production environment approval. If the release bot authored the PR, its admin reviewer can also merge it.

Follow docs/RELEASE.md for acceptance and cutover. Do not mix content completion, missing service credentials or a domain transfer into a claim that CI alone makes the website ready to publish.
