import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { smoke } from './smoke.mjs';

const reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'production', PUBLIC_SITE_URL: base };
for (const key of ['COCKPIT_API_URL', 'JOBBOARD_READ_API_KEY', 'JOBBOARD_SUBMIT_API_KEY', 'JOBBOARD_METRICS_API_KEY']) delete env[key];
const directory = process.argv.slice(2).filter(arg => arg !== '--')[0] || '.astro/ci-node';
const server = spawn(process.execPath, [resolve(directory, 'server/entry.mjs')], { env, stdio: ['ignore', 'ignore', 'pipe'] });
let errors = '';
server.stderr.on('data', chunk => { errors += chunk; });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Local server exited: ${errors.slice(-1000)}`);
    try { await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) }); ready = true; break; } catch { await setTimeout(150); }
  }
  if (!ready) throw new Error('Local built server did not start.');
  await smoke(base, { commit: process.env.RELEASE_COMMIT_SHA || null, tree: process.env.RELEASE_TREE_SHA || null });
} finally {
  if (server.exitCode === null) { server.kill('SIGTERM'); await once(server, 'exit'); }
}
