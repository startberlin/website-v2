import assert from 'node:assert/strict';
import test from 'node:test';
import { assertBranchRules, assertEnvironment, assertProductionReviewers, assertRelease, isStagingDeployment, assertRulesetBypass, assertTechnicalRules } from './verify-github.mjs';
import { assertVercelProject } from './project-config.mjs';

test('deployments require the intended unlinked project and reject a restored Git connection', () => {
  const identity = { projectId: 'new-project', projectName: 'website-v2', orgId: 'start-team' };
  const project = { id: 'new-project', name: 'website-v2', accountId: 'start-team', autoAssignCustomDomains: false, link: null };
  assert.doesNotThrow(() => assertVercelProject(project, identity));
  assert.throws(() => assertVercelProject({ ...project, link: { type: 'github', repo: 'website-v2', productionBranch: 'production' } }, identity));
  assert.throws(() => assertVercelProject({ ...project, id: 'legacy-project' }, identity));
  assert.throws(() => assertVercelProject({ ...project, accountId: 'personal-team' }, identity));
  assert.throws(() => assertVercelProject({ ...project, autoAssignCustomDomains: true }, identity));
});

const rules = () => [
  { type: 'deletion' }, { type: 'non_fast_forward' },
  { type: 'pull_request', parameters: { required_approving_review_count: 1, require_code_owner_review: true, dismiss_stale_reviews_on_push: true, require_last_push_approval: true, required_review_thread_resolution: true } },
  { type: 'required_status_checks', parameters: { strict_required_status_checks_policy: true, required_status_checks: [{ context: 'Required checks', integration_id: 15368 }] } },
];
test('admin review bypass is restricted to PR merges and cannot include technical rules', () => {
  const reviewOnly = { bypass_actors: [{ actor_type: 'RepositoryRole', actor_id: 5, bypass_mode: 'pull_request' }], rules: [rules()[2]] };
  assert.doesNotThrow(() => assertRulesetBypass(reviewOnly));
  assert.throws(() => assertRulesetBypass({ ...reviewOnly, rules: rules() }));
  assert.throws(() => assertRulesetBypass({ ...reviewOnly, bypass_actors: [{ ...reviewOnly.bypass_actors[0], actor_id: 3 }] }));
  assert.throws(() => assertRulesetBypass({ ...reviewOnly, bypass_actors: [{ ...reviewOnly.bypass_actors[0], bypass_mode: 'always' }] }));
});
test('technical protection enforces PRs and CI for admins without a second reviewer', () => {
  const technical = { bypass_actors: [], rules: rules() };
  technical.rules[2].parameters = { required_approving_review_count: 0, require_code_owner_review: false, require_last_push_approval: false, required_review_thread_resolution: true };
  assert.doesNotThrow(() => assertTechnicalRules(technical, 'main'));
  assert.throws(() => assertTechnicalRules({ ...technical, bypass_actors: [{ actor_type: 'RepositoryRole', actor_id: 5 }] }, 'main'));
  assert.throws(() => assertTechnicalRules({ ...technical, rules: technical.rules.filter(rule => rule.type !== 'required_status_checks') }, 'main'));
});
test('branch guards reject missing review, stale approval and impersonated checks', () => {
  assert.doesNotThrow(() => assertBranchRules(rules(), 'main'));
  for (const field of ['require_code_owner_review', 'dismiss_stale_reviews_on_push', 'require_last_push_approval']) {
    const weaker = rules(); weaker[2].parameters[field] = false;
    assert.throws(() => assertBranchRules(weaker, 'main'));
  }
  const spoofed = rules(); spoofed[3].parameters.required_status_checks[0].integration_id = 123;
  assert.throws(() => assertBranchRules(spoofed, 'main'));
  const double = rules(); double[2].parameters.required_approving_review_count = 2;
  assert.throws(() => assertBranchRules(double, 'production'));
  const extra = rules(); extra[2].parameters.require_extra_approval_for_unattributed_changes = true;
  assert.throws(() => assertBranchRules(extra, 'production'));
  const release = rules(); release[2].parameters.require_last_push_approval = false;
  assert.doesNotThrow(() => assertBranchRules(release, 'production'));
});
test('deployment environments cannot allow arbitrary branches', () => {
  assert.doesNotThrow(() => assertEnvironment({ custom_branch_policies: true, protected_branches: false }, 'production'));
  assert.throws(() => assertEnvironment(null, 'production'));
  assert.throws(() => assertEnvironment({ protected_branches: true }, 'production'));
});
test('production needs one release-PR approval without a second environment approval', () => {
  const settings = () => ({ can_admins_bypass: false, protection_rules: [{ type: 'branch_policy' }] });
  assert.doesNotThrow(() => assertProductionReviewers(settings()));
  const bypass = settings(); bypass.can_admins_bypass = true;
  assert.throws(() => assertProductionReviewers(bypass));
  const second = settings(); second.protection_rules.push({ type: 'required_reviewers', reviewers: [{ type: 'User', reviewer: { login: 'admin' } }] });
  assert.throws(() => assertProductionReviewers(second));
});
const candidate = () => ({ merged: true, base: { ref: 'production' }, head: { ref: 'main', sha: 'staged-sha', repo: { full_name: 'startberlin/website-v2' } }, merge_commit_sha: 'production-sha', user: { login: 'author' } });
const review = () => [{ state: 'APPROVED', commit_id: 'staged-sha', user: { login: 'admin' } }];
const staging = () => [{
  run: { path: '.github/workflows/deploy-staging.yml', head_sha: 'staged-sha', head_branch: 'main', status: 'completed', conclusion: 'success', event: 'push' },
  jobs: [{ name: 'deploy', head_sha: 'staged-sha', status: 'completed', conclusion: 'success' }],
}];
const check = (pr = candidate(), reviews = review(), tree = 'same-tree', runs = staging()) => assertRelease(pr, reviews, ['admin'], 'production-sha', 'same-tree', tree, runs);
test('production rejects unreviewed source, stale reviews and content not staged', () => {
  assert.doesNotThrow(() => check());
  assert.throws(() => check(candidate(), []));
  assert.throws(() => check(candidate(), [{ ...review()[0], commit_id: 'older-sha' }]));
  assert.throws(() => check(candidate(), [{ ...review()[0], user: { login: 'developer' } }]));
  assert.throws(() => check(candidate(), review(), 'changed-tree'));
  assert.throws(() => check(candidate(), review(), 'same-tree', []));
  const direct = candidate(); direct.head.ref = 'feature'; assert.throws(() => check(direct));
});
test('an admin may authorize their own release by merging; dismissed reviews alone do not permit release', () => {
  const own = candidate(); own.user.login = 'admin'; assert.throws(() => check(own));
  own.merged_by = { login: 'admin', type: 'User' }; assert.doesNotThrow(() => check(own, []));
  const nonAdmin = candidate(); nonAdmin.merged_by = { login: 'developer', type: 'User' }; assert.throws(() => check(nonAdmin, []));
  const bot = candidate(); bot.merged_by = { login: 'admin', type: 'Bot' }; assert.throws(() => check(bot, []));
  assert.throws(() => check(own, [], 'different-tree'));
  assert.throws(() => check(candidate(), [...review(), { ...review()[0], state: 'DISMISSED' }]));
  assert.doesNotThrow(() => check(candidate(), [...review(), { ...review()[0], state: 'COMMENTED' }]));
});
test('manual staging is valid, while skipped, failed and unrelated runs cannot open a release', () => {
  const manual = staging(); manual[0].run.event = 'workflow_dispatch';
  assert.doesNotThrow(() => check(candidate(), review(), 'same-tree', manual));
  for (const conclusion of ['skipped', 'failure', 'cancelled', null]) {
    const falseGreen = staging(); falseGreen[0].jobs[0].conclusion = conclusion;
    assert.throws(() => check(candidate(), review(), 'same-tree', falseGreen));
  }
  const missing = staging(); missing[0].jobs = [];
  assert.equal(isStagingDeployment(missing[0], 'staged-sha'), false);
  for (const [key, value] of [['head_sha', 'older-sha'], ['head_branch', 'feature'], ['path', '.github/workflows/ci.yml'], ['event', 'pull_request']]) {
    const unrelated = staging(); unrelated[0].run[key] = value;
    assert.equal(isStagingDeployment(unrelated[0], 'staged-sha'), false);
  }
});
