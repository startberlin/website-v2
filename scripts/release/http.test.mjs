import assert from 'node:assert/strict';
import test from 'node:test';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { curlResponse, vercelGet } from './http.mjs';

test('protected responses use the final HTTP headers after a proxy handshake', async () => {
  const response = curlResponse('HTTP/1.1 200 Connection established\r\n\r\nHTTP/2 200\r\ncontent-type: application/json\r\ncache-control: no-store\r\nx-robots-tag: noindex, nofollow\r\n\r\n', '{"ok":true}');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.deepEqual(await response.json(), { ok: true });
  assert.throws(() => curlResponse('not HTTP', 'login page'));
});

test('redirects and authentication failures remain observable instead of passing as page responses', () => {
  const redirect = curlResponse('HTTP/2 301\nlocation: /legal-notice\n\n', 'redirect');
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('location'), '/legal-notice');
  assert.equal(curlResponse('HTTP/2 401\ncontent-type: text/html\n\n', 'login').status, 401);
});

test('authenticated transport requests the exact URL without following redirects and removes temporary responses', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'website-http-test-'));
  const cli = join(directory, 'vercel.mjs');
  const record = join(directory, 'request.json');
  try {
    await writeFile(cli, `#!/usr/bin/env node\nimport {writeFileSync} from 'node:fs';\nconst args=process.argv.slice(2);\nwriteFileSync(${JSON.stringify(record)}, JSON.stringify(args));\nwriteFileSync(args[args.indexOf('--dump-header')+1], 'HTTP/2 200\\r\\ncontent-type: application/json\\r\\n\\r\\n');\nwriteFileSync(args[args.indexOf('--output')+1], '{"ok":true}');\n`);
    await chmod(cli, 0o700);
    const response = await vercelGet(new URL('https://selected.vercel.app/api/health'), cli);
    assert.deepEqual(await response.json(), { ok: true });
    const args = JSON.parse(await readFile(record, 'utf8'));
    assert.equal(args[1], 'https://selected.vercel.app/api/health');
    assert.ok(!args.includes('--scope'), 'Project tokens cannot query user scope.');
    assert.ok(!args.includes('--non-interactive'), 'The CLI must not forward this unsupported option to native curl.');
    assert.ok(args.includes('--no-location'));
    await assert.rejects(readFile(args[args.indexOf('--dump-header') + 1]), { code: 'ENOENT' });
    await assert.rejects(readFile(args[args.indexOf('--output') + 1]), { code: 'ENOENT' });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
