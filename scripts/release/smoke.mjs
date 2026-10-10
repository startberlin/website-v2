import { pathToFileURL } from 'node:url';
import { pageRoutes } from './routes.mjs';
import { vercelGet } from './http.mjs';

export async function smoke(base, { commit = null, tree = null, jobs = 'optional', preview = false } = {}) {
  const origin = new URL(base);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname);
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || (!local && (origin.protocol !== 'https:' || !(origin.hostname.endsWith('.vercel.app') || ['staging.start-berlin.com', 'www.start-berlin.com'].includes(origin.hostname))))) throw new Error('Smoke checks require an exact allowed deployment origin.');
  const headers = {};
  if (!local && process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  async function get(path, expected) {
    const target = new URL(path, origin);
    if (target.origin !== origin.origin) throw new Error('Smoke checks must stay on the selected deployment.');
    const response = !local && process.env.VERCEL_CLI
      ? await vercelGet(target)
      : await fetch(target, { headers, redirect: 'manual', signal: AbortSignal.timeout(30_000) });
    if (!expected.includes(response.status)) throw new Error(`${path}: expected ${expected.join('/')} but got ${response.status}.`);
    if (preview && response.headers.get('x-robots-tag') !== 'noindex, nofollow') throw new Error(`${path}: preview indexing is not blocked.`);
    return response;
  }
  const health = await get('/api/health', [200]);
  const identity = await health.json();
  if (identity.ok !== true || identity.commit !== commit || identity.tree !== tree || !health.headers.get('cache-control')?.includes('no-store')) throw new Error('Deployment identity differs from the tested source, or the health response is cached.');
  let jobsAvailable = false;
  const routes = pageRoutes();
  for (const path of routes) {
    const response = await get(path, path === '/jobs' && jobs !== 'required' ? [200, 503] : [200]);
    if (path === '/jobs') jobsAvailable = response.status === 200;
    const html = await response.text();
    if ((html.match(/<main\b/g) || []).length !== 1 || (html.match(/<h1\b/g) || []).length !== 1) throw new Error(`${path}: missing or duplicated page landmarks.`);
  }
  for (const [path, destination] of [['/legal/legal-notice.html', '/legal-notice'], ['/legal/privacy.html', '/privacy-policy']]) {
    const response = await get(path, [301]);
    if (new URL(response.headers.get('location'), origin).pathname !== destination) throw new Error(`${path}: incorrect legacy redirect.`);
  }
  console.log(`Smoke checks passed for ${routes.length} current pages. Jobs: ${jobsAvailable ? 'available' : 'controlled unavailable state (not backend acceptance)'}.`);
  return { jobsAvailable };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await smoke(process.env.DEPLOYMENT_URL, { commit: process.env.RELEASE_COMMIT_SHA || null, tree: process.env.RELEASE_TREE_SHA || null, jobs: process.env.SMOKE_JOBS || 'optional', preview: process.env.SMOKE_PREVIEW === 'true' });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
