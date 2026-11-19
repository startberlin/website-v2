import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolveSiteConfig } from '../../src/lib/seo/site.mjs';
import { assertRedirectLocation, legacyCampaignRedirects } from './routes.mjs';
import { assertSecurityHeaders } from './security-headers.mjs';

const app = (await import(pathToFileURL(process.argv[2]).href)).default;
let server;
try {
  let origin = 'http://127.0.0.1';
  let get;
  if (typeof app?.fetch === 'function') get = (path) => app.fetch(new Request(new URL(path, origin)));
  else if (typeof app === 'function') {
    server = createServer(app);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    origin = `http://127.0.0.1:${server.address().port}`;
    get = (path) => fetch(new URL(path, origin), { signal: AbortSignal.timeout(10_000), redirect: 'manual' });
  } else throw new Error('Unsupported packaged Node function export.');
  const response = await get('/api/health');
  if (response.status === 200) {
    assertSecurityHeaders(response.headers, '/api/health');
    const expectedRobots = resolveSiteConfig(process.env).indexable ? null : 'noindex, nofollow';
    for (const [path, destination] of legacyCampaignRedirects) {
      const redirect = await get(path);
      if (redirect.status !== 301 || redirect.headers.get('x-robots-tag') !== expectedRobots) {
        throw new Error(`${path}: packaged redirect has an incorrect status or indexing policy.`);
      }
      assertSecurityHeaders(redirect.headers, path);
      assertRedirectLocation(redirect, origin, path, destination);
    }
  }
  console.log(JSON.stringify({ status: response.status, cache: response.headers.get('cache-control'), robots: response.headers.get('x-robots-tag'), identity: response.status === 200 ? await response.json() : null }));
} finally { if (server) await new Promise(resolve => server.close(resolve)); }
