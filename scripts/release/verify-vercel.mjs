import { config } from './verify-github.mjs';

const { VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID } = process.env;
if (!VERCEL_TOKEN || !VERCEL_ORG_ID || VERCEL_PROJECT_ID !== config.vercelProjectId) throw new Error('Configure the new website-v2 Vercel project. Never use the legacy project ID.');
async function api(path) {
  const url = new URL(`https://api.vercel.com${path}`);
  url.searchParams.set('teamId', VERCEL_ORG_ID);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Vercel configuration check returned ${response.status}.`);
  return response.json();
}
const project = await api(`/v9/projects/${VERCEL_PROJECT_ID}`);
if (project.id !== config.vercelProjectId || project.name !== config.vercelProject || project.accountId !== VERCEL_ORG_ID) throw new Error('Vercel project identity does not match the reviewed release configuration.');
if (project.link && project.link.productionBranch !== 'production') throw new Error('The Vercel production branch must be production.');
if (project.autoAssignCustomDomains !== false) throw new Error('Disable automatic production domain assignment before enabling the pipeline.');
if (process.argv[2] === 'staging') {
  const host = new URL(config.stagingOrigin).hostname;
  const domain = await api(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${host}`);
  if (!domain.verified || domain.gitBranch !== config.reservedStagingBranch || domain.redirect) throw new Error('The verified staging domain must use the reserved staging branch.');
}
if (process.argv[2] === 'pr-preview') {
  const data = await api(`/v9/projects/${VERCEL_PROJECT_ID}/env`);
  const allowed = new Set(['PUBLIC_SITE_URL', 'JOBBOARD_METRICS_ENABLED']);
  for (const variable of data.envs) {
    if (variable.target?.includes('preview') && !variable.gitBranch && !allowed.has(variable.key)) throw new Error('PR previews must have no shared service credentials. Scope private Preview variables to main.');
  }
}
console.log('Verified the intended Vercel project and deployment settings.');
