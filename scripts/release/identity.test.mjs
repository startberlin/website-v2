import assert from 'node:assert/strict';
import test from 'node:test';
import { deploymentHealth } from './identity.mjs';

const expected = { commit: 'reviewed-commit', tree: 'reviewed-tree' };
const health = (identity = expected, cache = 'no-store') => Response.json({ ok: true, ...identity }, { headers: { 'Cache-Control': cache } });

test('a stable alias must eventually expose the exact source after briefly serving its previous deployment', async () => {
  let requests = 0;
  const delays = [];
  const identity = await deploymentHealth(async () => health(++requests === 3 ? expected : { commit: 'previous', tree: 'previous-tree' }), expected, { waitForSource: true, pause: async ms => { delays.push(ms); } });
  assert.equal(identity.commit, expected.commit);
  assert.equal(identity.tree, expected.tree);
  assert.equal(requests, 3);
  assert.deepEqual(delays, [2000, 2000]);
});

test('a persistent wrong commit or source tree never passes and an immutable deployment fails immediately', async () => {
  for (const waitForSource of [false, true]) {
    let requests = 0;
    await assert.rejects(deploymentHealth(async () => { requests++; return health({ ...expected, tree: 'wrong-tree' }); }, expected, { waitForSource, pause: async () => {} }), /identity differs/);
    assert.equal(requests, waitForSource ? 8 : 1);
  }
});

test('alias waiting cannot hide invalid health, caching or a transport failure', async () => {
  for (const read of [async () => health({ ...expected, ok: false }), async () => health(expected, 'public, max-age=60'), async () => { throw new Error('HTTP 401'); }]) {
    let delays = 0;
    await assert.rejects(deploymentHealth(read, expected, { waitForSource: true, pause: async () => { delays++; } }));
    assert.equal(delays, 0);
  }
});
