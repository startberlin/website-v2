import { config } from './verify-github.mjs';
import { assertPreviewVariables } from './preview-env.mjs';
import { assertVercelProject } from './project-config.mjs';

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
assertVercelProject(project, { projectId: config.vercelProjectId, projectName: config.vercelProject, orgId: VERCEL_ORG_ID });
if (process.argv[2] === 'publish') {
  const host = new URL(config.productionOrigin).hostname;
  const domain = await api(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${host}`);
  if (!domain.verified || domain.gitBranch || domain.redirect) throw new Error('Attach the verified production domain to website-v2 during the approved cutover before enabling regular publication.');
}
if (process.argv[2] === 'staging') {
  const host = new URL(config.stagingOrigin).hostname;
  const domain = await api(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${host}`);
  if (!domain.verified || domain.gitBranch !== config.reservedStagingBranch || domain.redirect) throw new Error('The verified staging domain must use the reserved staging branch.');
}
if (['staging', 'pr-preview'].includes(process.argv[2])) {
  const data = await api(`/v9/projects/${VERCEL_PROJECT_ID}/env?decrypt=false`);
  assertPreviewVariables(data.envs);
}
console.log('Verified the intended Vercel project and deployment settings.');
