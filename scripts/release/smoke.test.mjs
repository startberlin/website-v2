import assert from 'node:assert/strict';
import test from 'node:test';
import { smoke } from './smoke.mjs';

test('public-domain verification detects guest protection despite valid automation access', async () => {
  const originalFetch = globalThis.fetch;
  const previousCli = process.env.VERCEL_CLI;
  const previousSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  let requests = 0;
  try {
    process.env.VERCEL_CLI = '/should-not-be-used-for-a-public-domain';
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = 'automation-access-would-hide-this-failure';
    globalThis.fetch = async (url, options) => {
      requests++;
      assert.equal(new URL(url).hostname, 'staging.start-berlin.com');
      assert.equal(new Headers(options.headers).get('x-vercel-protection-bypass'), null);
      assert.equal(options.redirect, 'manual');
      return new Response('Protected by Vercel Authentication', { status: 401 });
    };
    await assert.rejects(smoke('https://staging.start-berlin.com', { publicAccess: true }), /expected 200 but got 401/);
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousCli === undefined) delete process.env.VERCEL_CLI; else process.env.VERCEL_CLI = previousCli;
    if (previousSecret === undefined) delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET; else process.env.VERCEL_AUTOMATION_BYPASS_SECRET = previousSecret;
  }
});

test('a ready deployment cannot pass when its actual Node runtime differs from CI', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const nodeMajor of [undefined, Number(process.versions.node.split('.')[0]) + 2]) {
      let requests = 0;
      globalThis.fetch = async () => {
        requests++;
        return Response.json({ ok: true, commit: null, tree: null, nodeMajor, deploymentCredentialsExposed: false }, { headers: { 'Cache-Control': 'no-store' } });
      };
      await assert.rejects(smoke('http://127.0.0.1'), /Node major differs/);
      assert.equal(requests, 1, 'Reject incompatible runtime before accepting pages or assigning domains.');
    }
  } finally { globalThis.fetch = originalFetch; }
});
