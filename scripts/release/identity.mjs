import { setTimeout } from 'node:timers/promises';

export async function deploymentHealth(read, { commit = null, tree = null }, { waitForSource = false, pause = setTimeout } = {}) {
  const attempts = waitForSource ? 8 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await read();
    const identity = await response.json();
    if (identity.ok !== true || !response.headers.get('cache-control')?.includes('no-store')) {
      throw new Error('Deployment health is invalid or cached.');
    }
    if (identity.commit === commit && identity.tree === tree) return identity;
    if (attempt + 1 < attempts) await pause(2000);
  }
  throw new Error('Deployment identity differs from the tested source after the allowed alias propagation window.');
}
