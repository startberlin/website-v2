import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const config = JSON.parse(readFileSync(new URL('../../.github/release-config.json', import.meta.url), 'utf8'));

export async function github(path) {
  if (!process.env.GH_TOKEN) throw new Error('GH_TOKEN is required for the read-only release guard.');
  const response = await fetch(`https://api.github.com/repos/${config.repository}/${path}`, {
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`GitHub ${path.split('?')[0]} returned ${response.status}. Verify workflow read permissions and the repository's active release controls.`);
  return response.json();
}

export function assertBranchRules(rules, branch) {
  for (const type of ['deletion', 'non_fast_forward']) {
    if (!rules.some(rule => rule.type === type)) throw new Error(`${branch}: missing ${type} protection.`);
  }
  const review = rules.find(rule => rule.type === 'pull_request' && rule.parameters.required_approving_review_count === 1)?.parameters;
  if (!review || review.required_approving_review_count !== 1 || review.require_extra_approval_for_unattributed_changes === true || !review.require_code_owner_review || !review.dismiss_stale_reviews_on_push || (branch === 'main' && !review.require_last_push_approval) || !review.required_review_thread_resolution) {
    throw new Error(`${branch}: require an independent code-owner review of the latest push and resolved discussions.`);
  }
  const status = rules.find(rule => rule.type === 'required_status_checks')?.parameters;
  if (!status?.required_status_checks?.some(check => check.context === config.requiredCheck && check.integration_id === 15368)) {
    throw new Error(`${branch}: require ${config.requiredCheck} from GitHub Actions.`);
  }
  if (branch === 'main' && !status.strict_required_status_checks_policy) throw new Error('main: require checks against the current base.');
}

export function assertRulesetBypass(ruleset) {
  const actors = ruleset.bypass_actors || [];
  if (!actors.length) return;
  if (actors.length !== 1 || actors[0].actor_type !== 'RepositoryRole' || actors[0].actor_id !== 5 || actors[0].bypass_mode !== 'pull_request' || ruleset.rules.length !== 1 || ruleset.rules[0].type !== 'pull_request') {
    throw new Error('Only repository admins may bypass the review-only rule, and only when merging a PR. Technical checks cannot be bypassed.');
  }
}

export function assertTechnicalRules(ruleset, branch) {
  if (ruleset.bypass_actors?.length) throw new Error(`${branch}: technical rules must apply to admins too.`);
  const review = ruleset.rules.find(rule => rule.type === 'pull_request')?.parameters;
  if (!review || review.required_approving_review_count !== 0 || review.require_code_owner_review || review.require_last_push_approval || !review.required_review_thread_resolution) throw new Error(`${branch}: the technical rule must enforce PRs and resolved discussions without requiring another reviewer.`);
  for (const type of ['deletion', 'non_fast_forward', 'required_status_checks']) {
    if (!ruleset.rules.some(rule => rule.type === type)) throw new Error(`${branch}: missing unbypassable ${type} rule.`);
  }
}

export function assertEnvironment(policy, branch) {
  if (!policy?.custom_branch_policies || policy.protected_branches) throw new Error(`Environment must allow only ${branch}, using a custom branch policy.`);
}

export function assertProductionReviewers(settings) {
  const rule = settings.protection_rules?.find(rule => rule.type === 'required_reviewers');
  if (settings.can_admins_bypass !== false || rule?.reviewers?.length) {
    throw new Error('Production uses one admin release-PR approval. Do not add a second environment approval.');
  }
}

export function isStagingDeployment({ run, jobs }, sourceSha) {
  return run.path === '.github/workflows/deploy-staging.yml'
    && run.head_sha === sourceSha && run.head_branch === 'main'
    && run.status === 'completed' && run.conclusion === 'success'
    && ['push', 'workflow_dispatch'].includes(run.event)
    && jobs.some(job => job.name === 'deploy' && job.head_sha === sourceSha
      && job.status === 'completed' && job.conclusion === 'success');
}

export async function stagingEvidence(run) {
  const data = await github(`actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`);
  return { run, jobs: data.jobs };
}

async function verifiedStagingSource(sourceSha = null) {
  const filter = sourceSha ? `head_sha=${sourceSha}` : 'branch=main&status=success';
  const runs = await github(`actions/workflows/deploy-staging.yml/runs?${filter}&per_page=100`);
  for (const run of runs.workflow_runs.filter(item => item.conclusion === 'success')) {
    const staged = await stagingEvidence(run);
    if (isStagingDeployment(staged, sourceSha || run.head_sha)) return staged;
  }
  return null;
}

export async function verifyStagingRun(runId, sourceSha) {
  if (!/^\d+$/.test(runId || '')) throw new Error('A staging workflow run ID is required.');
  const evidence = await stagingEvidence(await github(`actions/runs/${runId}`));
  if (!isStagingDeployment(evidence, sourceSha)) throw new Error('Staging must deploy and verify the exact main source. Skipped jobs do not count.');
  return evidence;
}

export function assertRelease(pr, reviews, adminLogins, targetCommit, sourceTree, targetTree, stagedRuns) {
  if (!pr.merged || pr.base.ref !== 'production' || pr.head.ref !== 'main' || pr.head.repo.full_name !== config.repository || pr.merge_commit_sha !== targetCommit) {
    throw new Error('Production must be the merge of a main-to-production release PR.');
  }
  if (sourceTree !== targetTree) throw new Error('Production content differs from the staged main commit.');
  const latest = new Map();
  for (const review of reviews) {
    if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) latest.set(review.user.login, review);
  }
  const approval = [...latest.values()].some(review => review.state === 'APPROVED' && review.commit_id === pr.head.sha && review.user.login !== pr.user.login && adminLogins.includes(review.user.login));
  const adminMerge = pr.merged_by?.type === 'User' && adminLogins.includes(pr.merged_by.login);
  if (!approval && !adminMerge) throw new Error('One repository admin must approve the exact release commit or authorize it by merging the release PR.');
  if (!stagedRuns.some(evidence => isStagingDeployment(evidence, pr.head.sha))) {
    throw new Error('The exact release source has no successful staging deployment.');
  }
}

export async function verifyConfiguration(environment) {
  const applied = new Map();
  for (const branch of ['main', 'production']) {
    const rules = await github(`rules/branches/${branch}`);
    assertBranchRules(rules, branch);
    applied.set(branch, rules);
  }
  // An admin merge is an approval, including on the admin's own PR. CI stays separate.
  const rulesets = await github('rulesets?includes_parents=true&per_page=100');
  const details = new Map();
  for (const summary of rulesets.filter(item => item.enforcement === 'active' && item.source === config.repository)) {
    const ruleset = await github(`rulesets/${summary.id}`);
    assertRulesetBypass(ruleset);
    details.set(summary.id, ruleset);
  }
  for (const [branch, rules] of applied) {
    const technical = rules.find(rule => rule.type === 'required_status_checks' && details.has(rule.ruleset_id));
    if (!technical) throw new Error(`${branch}: a repository-owned technical ruleset is required.`);
    assertTechnicalRules(details.get(technical.ruleset_id), branch);
  }
  const text = readFileSync(new URL('../../.github/CODEOWNERS', import.meta.url), 'utf8');
  const rows = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  if (rows.length !== 1 || !rows[0].startsWith('* ')) throw new Error('Use one global CODEOWNERS rule containing repository admins.');
  const owners = rows[0].split(/\s+/).slice(1).map(owner => owner.replace(/^@/, ''));
  if (!owners.length || owners.some(owner => !/^[\w-]+$/.test(owner))) throw new Error('CODEOWNERS must contain individual verified admin logins.');
  for (const owner of owners) {
    if ((await github(`collaborators/${owner}/permission`)).permission !== 'admin') throw new Error(`Code owner ${owner} is no longer a repository admin.`);
  }
  const branch = environment === 'production' ? 'production' : 'main';
  const settings = await github(`environments/${environment}`);
  assertEnvironment(settings.deployment_branch_policy, branch);
  if (environment === 'production') assertProductionReviewers(settings);
  const policies = (await github(`environments/${environment}/deployment-branch-policies`)).branch_policies;
  if (policies.length !== 1 || policies[0].name !== branch || policies[0].type !== 'branch') throw new Error(`${environment}: only the ${branch} branch may deploy.`);
  return owners;
}

export async function verifyRelease(owners) {
  const targetCommit = process.env.GITHUB_SHA;
  const candidates = await github(`commits/${targetCommit}/pulls?per_page=100`);
  const pr = candidates.find(item => item.base.ref === 'production' && item.merge_commit_sha === targetCommit);
  if (!pr) throw new Error('No merged release PR belongs to this production commit.');
  const full = await github(`pulls/${pr.number}`);
  if (full.merged_by?.type === 'User' && (await github(`collaborators/${full.merged_by.login}/permission`)).permission === 'admin') owners = [...new Set([...owners, full.merged_by.login])];
  const source = await github(`git/commits/${full.head.sha}`);
  const targetTree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim();
  const staged = await verifiedStagingSource(full.head.sha);
  const evidence = staged ? [staged] : [];
  assertRelease(full, await github(`pulls/${pr.number}/reviews?per_page=100`), owners, targetCommit, source.tree.sha, targetTree, evidence);
}

export async function verifyPreview() {
  const actor = process.env.PREVIEW_ACTOR || process.env.GITHUB_ACTOR;
  if (!['admin', 'write', 'maintain'].includes((await github(`collaborators/${actor}/permission`)).permission)) throw new Error('A repository contributor with Write access is required for a PR preview.');
  const number = process.env.PR_NUMBER;
  if (!/^\d+$/.test(number || '')) throw new Error('A PR number is required.');
  const pr = await github(`pulls/${number}`);
  if (pr.state !== 'open' || pr.base.ref !== 'main' || pr.head.repo.full_name !== config.repository) throw new Error('Preview only open same-repository PRs targeting main.');
  const checks = await github(`actions/workflows/ci.yml/runs?head_sha=${pr.head.sha}&event=pull_request&per_page=100`);
  if (!checks.workflow_runs.some(run => run.conclusion === 'success' && run.pull_requests.some(item => item.number === pr.number))) throw new Error('The selected PR commit must pass CI before requesting a preview.');
  if (!await verifiedStagingSource()) throw new Error('Complete the first verified main staging deployment before creating PR previews.');
  const commit = await github(`git/commits/${pr.head.sha}`);
  return { sha: pr.head.sha, branch: pr.head.ref, tree: commit.tree.sha };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const environment = process.argv[2] || 'staging';
    const owners = await verifyConfiguration(environment);
    if (environment === 'production') await verifyRelease(owners);
    if (environment === 'pr-preview') {
      const preview = await verifyPreview();
      const { appendFileSync } = await import('node:fs');
      appendFileSync(process.env.GITHUB_OUTPUT, `sha=${preview.sha}\nbranch=${preview.branch}\ntree=${preview.tree}\n`);
    }
    console.log(`Verified GitHub release controls for ${environment}.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
