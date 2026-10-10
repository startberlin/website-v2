# Contributing

## One change, one PR

Start a feature branch from current `main`. Explain the problem, keep the diff bounded and open a PR to `main`. Direct pushes to `main` and `production`, force pushes and branch deletion are blocked. Admins follow the same branch rules.

A repository admin reviews and authorizes the latest feature commit. Admins can authorize any PR, including their own, by intentionally merging it after checking the diff and evidence. GitHub does not allow the author to submit a separate Approve review. CODEOWNERS currently lists the verified repository admins: `jannikbln`, `zunkelty`, `ahaMfM` and `DieProgrammIDE`. A changed role requires updating the owner list; deployment guards reject a code owner who is no longer an admin. Read access or an ordinary approval from another contributor does not satisfy the code-owner rule.

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
pnpm test
pnpm exec astro build --outDir .astro/ci-node
pnpm run smoke:local -- .astro/ci-node
pnpm run build:vercel
```

These checks use no production credentials. The local smoke server uses an available loopback port, clears Cockpit keys and shuts itself down. A controlled Jobs 503 is valid for this isolated test and does not establish backend acceptance.

CI derives its work from the changed files. It discovers native test files and follows their local import dependencies, including transitive imports. New tests need no workflow edit. Typecheck and every `check:*` script are discovered from package.json when application source changes. New non-native `test:*` runners are also registered automatically; keep them self-contained for CI. Direct Node test scripts remain useful local shortcuts and do not cause duplicate CI execution.

Documentation-only PRs skip builds and unrelated behaviour tests. Styles build and run source checks; native tests are selected only when they depend on the changed source. Dependencies, deleted runtime files and uncertain imports widen verification conservatively. After merge, staging/production run the full current suite and both builds. The CI summary records what ran. Required checks is one stable merge status for the generated plan; a needed check that fails or disappears prevents merge. Intentional skips can pass only when the plan says that check is unnecessary.

After successful CI, each same-repository PR gets its own preview when deployment activation is enabled. Contributors with Write access can request a fresh preview through Deploy PR preview. The fixed staging domain shows the latest successfully tested `main`, not every open PR at once. Vercel's deployment list is the overview of those individual previews.

## Releasing

After merge, staging validates the exact source before assigning its domain. The release bot opens a `main`-to-`production` PR only after staging succeeds. One admin approves that release PR through review or intentional merge, including when that admin is its author. There is no second production environment approval. Technical rules require a PR, resolved discussions and passing CI for admins too.

Follow docs/RELEASE.md for acceptance and cutover. Do not mix content completion, missing service credentials or a domain transfer into a claim that CI alone makes the website ready to publish.
