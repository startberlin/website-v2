# Cockpit pipeline review

Reviewed GitHub main at `372083719b6968e875187e9abbfc372392cd0a51` and production at `ec7af4a2663bae8cab6900a667bd8b11d947ecc4` on 10 October 2026. The separate local Cockpit checkout was on another feature branch, so the review and proposed fixes use an isolated snapshot of the actual remote main.

## What transfers

Cockpit uses main for a stable Preview staging domain, a separate production branch and an automatically opened release PR. It disables Git-triggered Vercel deployments. Production builds use --skip-domain, verify commit identity, apply migrations and then promote. The reserved staging branch protects the staging alias from being reassigned during a build. These are useful invariants for V2.

Website V2 has no database migrations or Inngest app. Those stages stay with Cockpit. V2 instead checks the Cockpit-backed website reads before production promotion. Both projects need a later acceptance check for actual mutation/delivery flows.

## Observed gaps

| Evidence | Consequence | Proposed change |
| --- | --- | --- |
| Cockpit PR CI ran only Biome. | Tests could fail after merge, during deployment. | Run the existing test suite and typecheck in PR CI, with an aggregate Required checks status. |
| Main's default ruleset only blocked deletion and non-fast-forward pushes; production was unprotected. | PRs, approval and green CI were not enforced. | Apply admin CODEOWNERS and reviewed branch rules after the workflow PR is merged. |
| [Release PR 213](https://github.com/startberlin/cockpit/pull/213) had no reviews. Its [CI run](https://github.com/startberlin/cockpit/actions/runs/37964440333) was marked failure, while production deployment succeeded. The jobs API returned no executed jobs and logs were unavailable. | The failed run did not prevent release. This is not evidence of a demonstrated lint failure. | Require a current admin review and successful checks. Handle the bot workflow-approval banner explicitly. |
| Open deploy PR ran independently on every main push and copied the latest fetched main. | A release candidate could precede successful staging or copy a newer, untested main tree. | Trigger after staging success and copy that exact verified commit. |
| The production build job accessed Vercel credentials before its later environment-gated release job. | The environment approval did not protect the earlier build credential use. | Scope deployment credentials carefully and preserve the explicit release approval; do not add unrequested extra human gates. |
| Cockpit health only returns ok and commit. | It does not verify database readiness or external integrations. | Retain liveness, record that limit and verify important reads before traffic changes. |

## Verification and boundary

The exact remote main passes Biome with existing warnings, all 387 current tests and typechecking after `next typegen`. Generating Next's declarations is necessary in a clean checkout; bare tsc initially failed on image imports. No live database, migration or external message was used for this review.

This is a read-only reference review. Jannik explicitly excluded Cockpit changes. No Cockpit PR, source change, setting change or deployment is part of this website task; the transferable improvements are implemented only in Website V2.
