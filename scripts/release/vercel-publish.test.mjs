import assert from 'node:assert/strict';
import test from 'node:test';
import { config } from './verify-github.mjs';
import { assertPublishDeployment, publish } from './vercel-publish.mjs';

const project = { id: config.vercelProjectId, name: config.vercelProject, accountId: 'team_test', autoAssignCustomDomains: false, autoExposeSystemEnvs: false, ssoProtection: { deploymentType: 'all_except_custom_domains' } };
const options = { id: 'dpl_test', orgId: 'team_test', commit: 'commit', mode: 'staging' };
const deployment = { id: options.id, projectId: project.id, ownerId: project.accountId, readyState: 'READY', target: null, meta: { githubCommitSha: options.commit, githubCommitRef: 'main' } };

test('publication rejects unrelated projects, owners, source commits and deployment environments', () => {
  assert.doesNotThrow(() => assertPublishDeployment(deployment, options));
  for (const change of [{ id: 'dpl_other' }, { projectId: 'prj_other' }, { ownerId: 'team_other' }, { readyState: 'BUILDING' }, { target: 'production' }, { meta: { ...deployment.meta, githubCommitSha: 'other' } }, { meta: { ...deployment.meta, githubCommitRef: 'feature' } }]) {
    assert.throws(() => assertPublishDeployment({ ...deployment, ...change }, options));
  }
  assert.throws(() => assertPublishDeployment(deployment, { ...options, mode: 'production' }));
});

test('staging assigns only the verified reserved alias after deployment identity checks', async () => {
  const requests = [];
  await publish('staging', { ...options, api: async (path, request) => {
    requests.push({ path, request });
    if (path.endsWith('/aliases')) return { alias: new URL(config.stagingOrigin).hostname };
    if (path.includes('/domains/')) return { verified: true, gitBranch: config.reservedStagingBranch };
    return path.includes('/deployments/') ? deployment : project;
  } });
  assert.equal(requests.at(-1).path, '/v2/deployments/dpl_test/aliases');
  assert.equal(requests.at(-1).request.body.alias, new URL(config.stagingOrigin).hostname);
});

test('a restored Git connection or incorrect domain cannot trigger an alias mutation', async () => {
  for (const broken of ['connection', 'domain', 'deployment']) {
    const mutations = [];
    await assert.rejects(publish('staging', { ...options, api: async (path, request) => {
      if (request) mutations.push(path);
      if (path.includes('/domains/')) return { verified: true, gitBranch: 'main' };
      if (path.includes('/deployments/')) return broken === 'deployment' ? { ...deployment, projectId: 'prj_other' } : deployment;
      return broken === 'connection' ? { ...project, link: { type: 'github' } } : project;
    } }));
    assert.deepEqual(mutations, []);
  }
});

test('production promotes the ready Production build and waits for that exact deployment', async () => {
  let promoted = false;
  await publish('production', { ...options, api: async (path, request) => {
    if (request) { assert.equal(path, `/v10/projects/${project.id}/promote/dpl_test`); promoted = true; return null; }
    if (path.includes('/deployments/')) return { ...deployment, target: 'production', meta: { ...deployment.meta, githubCommitRef: 'production' } };
    return promoted ? { ...project, lastAliasRequest: { toDeploymentId: 'dpl_test', jobStatus: 'succeeded' }, targets: { production: { id: 'dpl_test' } } } : project;
  } });
  assert.equal(promoted, true);
});

test('superseded or failed Production promotions cannot report success', async () => {
  for (const request of [{ toDeploymentId: 'dpl_other', jobStatus: 'succeeded', requestedAt: Date.now() + 1_000 }, { toDeploymentId: 'dpl_test', jobStatus: 'failed' }]) {
    let promoted = false;
    await assert.rejects(publish('production', { ...options, api: async (path, mutation) => {
      if (mutation) { promoted = true; return null; }
      if (path.includes('/deployments/')) return { ...deployment, target: 'production', meta: { ...deployment.meta, githubCommitRef: 'production' } };
      return promoted ? { ...project, lastAliasRequest: request } : project;
    } }));
  }
});

test('a previous promotion remains harmless while the new request becomes visible', async () => {
  let promoted = false;
  let waited = false;
  await publish('production', { ...options, wait: async () => { waited = true; }, api: async (path, mutation) => {
    if (mutation) { promoted = true; return null; }
    if (path.includes('/deployments/')) return { ...deployment, target: 'production', meta: { ...deployment.meta, githubCommitRef: 'production' } };
    if (!promoted) return project;
    return { ...project, lastAliasRequest: { toDeploymentId: waited ? 'dpl_test' : 'dpl_old', jobStatus: 'succeeded', requestedAt: 1 }, targets: { production: { id: waited ? 'dpl_test' : 'dpl_old' } } };
  } });
  assert.equal(waited, true);
});
