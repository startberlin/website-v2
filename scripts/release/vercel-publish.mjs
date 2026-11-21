import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { config } from './verify-github.mjs';
import { assertVercelProject } from './project-config.mjs';

// Project tokens cannot read user/team profiles. Address the verified project directly.
export async function vercelApi(path, { method = 'GET', body } = {}) {
  const { VERCEL_TOKEN: token, VERCEL_ORG_ID: orgId, VERCEL_PROJECT_ID: projectId } = process.env;
  if (!token || !orgId || projectId !== config.vercelProjectId) throw new Error('The reviewed V2 project credentials are required.');
  const url = new URL(path, 'https://api.vercel.com');
  url.searchParams.set('teamId', orgId);
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Vercel ${method} ${url.pathname} returned ${response.status}.`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function assertPublishDeployment(deployment, { id, orgId, commit, mode }) {
  const targetMatches = mode === 'staging' ? [null, 'preview'].includes(deployment.target) : deployment.target === 'production';
  if (deployment.id !== id || deployment.projectId !== config.vercelProjectId || (deployment.ownerId || deployment.team?.id) !== orgId || deployment.readyState !== 'READY' || !targetMatches || !commit || deployment.meta?.githubCommitSha !== commit || deployment.meta?.githubCommitRef !== (mode === 'staging' ? 'main' : 'production')) {
    throw new Error('Only the ready deployment of the exact reviewed source in the intended V2 project may be published.');
  }
}

export async function publish(mode, { id = process.env.DEPLOYMENT_ID, orgId = process.env.VERCEL_ORG_ID, commit = process.env.GITHUB_SHA, api = vercelApi, wait = delay, timeout = 300_000 } = {}) {
  if (!['staging', 'production'].includes(mode) || !/^dpl_[a-zA-Z0-9]+$/.test(id || '')) throw new Error('A staging or production deployment identity is required.');
  const project = await api(`/v9/projects/${config.vercelProjectId}`);
  assertVercelProject(project, { projectId: config.vercelProjectId, projectName: config.vercelProject, orgId });
  const deployment = await api(`/v13/deployments/${id}`);
  assertPublishDeployment(deployment, { id, orgId, commit, mode });
  if (mode === 'staging') {
    const host = new URL(config.stagingOrigin).hostname;
    const domain = await api(`/v9/projects/${project.id}/domains/${host}`);
    if (!domain.verified || domain.gitBranch !== config.reservedStagingBranch || domain.redirect) throw new Error('The staging domain must remain verified and reserved for staging.');
    const alias = await api(`/v2/deployments/${id}/aliases`, { method: 'POST', body: { alias: host } });
    if (alias.alias !== host) throw new Error('Vercel did not assign the expected staging alias.');
    return;
  }
  const requestedAt = Date.now();
  await api(`/v10/projects/${project.id}/promote/${id}`, { method: 'POST', body: {} });
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const current = await api(`/v9/projects/${project.id}`);
    const request = current.lastAliasRequest;
    if (request?.toDeploymentId === id && request.jobStatus === 'failed') throw new Error('Production promotion failed.');
    if (request?.toDeploymentId === id && request.jobStatus === 'succeeded' && current.targets?.production?.id === id) return;
    if (request?.toDeploymentId && request.toDeploymentId !== id && request.requestedAt >= requestedAt) throw new Error('Another production promotion superseded this candidate.');
    await wait(2_000);
  }
  throw new Error('Production promotion did not complete within five minutes.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await publish(process.argv[2]); console.log(`Published the tested ${process.argv[2]} deployment.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
