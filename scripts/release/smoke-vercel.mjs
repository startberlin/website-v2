import { cp, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

// Import the function away from checkout dependencies, as Vercel does.
const root = resolve('.vercel/output/functions');
const environment = { ...process.env, NODE_ENV: 'production', NODE_PATH: '' };
for (const name of Object.keys(environment)) if (/(?:TOKEN|KEY|SECRET)$/.test(name) || name === 'COCKPIT_API_URL') delete environment[name];
let verified = 0;
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.endsWith('.func')) continue;
  const source = join(root, entry.name);
  const configuration = JSON.parse(await readFile(join(source, '.vc-config.json'), 'utf8'));
  if (!configuration.runtime?.startsWith('nodejs')) continue;
  const directory = await mkdtemp(join(tmpdir(), 'website-function-'));
  try {
    const nodeMajor = Number(process.versions.node.split('.')[0]);
    if (configuration.runtime !== `nodejs${nodeMajor}.x`) throw new Error('Packaged function targets a different Node major than the CI runtime.');
    await cp(source, directory, { recursive: true, dereference: true });
    const handler = resolve(directory, configuration.handler);
    const path = relative(directory, handler);
    if (isAbsolute(path) || path.startsWith('..')) throw new Error('The function handler must stay inside its package.');
    const result = JSON.parse(execFileSync(process.execPath, [fileURLToPath(new URL('./function-probe.mjs', import.meta.url)), handler], {
      cwd: directory, env: environment, timeout: 30_000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }));
    if (result.status === 404) continue;
    if (result.identity?.nodeMajor !== nodeMajor) throw new Error('Packaged function runs a different Node major than the tested CI runtime.');
    if (result.status !== 200 || result.identity?.ok !== true || result.identity.deploymentCredentialsExposed !== false || result.identity.commit !== (process.env.RELEASE_COMMIT_SHA || null) || result.identity.tree !== (process.env.RELEASE_TREE_SHA || null) || !result.cache?.includes('no-store')) throw new Error('Packaged function health does not match the built source or contains deployment credentials.');
    verified++;
  } catch (error) {
    console.error(`Packaged Vercel function ${entry.name} failed its isolated startup/health check. ${error.status ? `Process exit: ${error.status}.` : error.message}`);
    process.exitCode = 1;
  } finally { await rm(directory, { recursive: true, force: true }); }
}
if (!verified && !process.exitCode) throw new Error('No packaged Vercel function serves application health.');
if (!process.exitCode) console.log(`Packaged Vercel runtime verified: ${verified} health handler.`);
