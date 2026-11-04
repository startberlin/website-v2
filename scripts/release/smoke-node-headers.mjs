import assert from 'node:assert/strict';
import { request } from 'node:http';
import { assertSecurityHeaders } from './security-headers.mjs';

// Use raw HTTP so conditional requests are not changed by fetch's cache behavior.
export async function smokeNodeHeaders(base) {
  async function get(path, expected, options = {}) {
    const result = await new Promise((resolve, reject) => {
      const req = request(new URL(path, base), options, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, headers: new Headers(response.headers), body }));
        response.on('error', reject);
      });
      req.setTimeout(10_000, () => req.destroy(new Error('Node header probe timed out.')));
      req.on('error', reject);
      req.end();
    });
    assert.equal(result.status, expected, path);
    assertSecurityHeaders(result.headers, path);
    return result;
  }
  const page = await get('/join', 200);
  assert.ok(page.headers.get('etag'), 'static HTML must retain its ETag');
  for (const [path, status] of [['/join/index.html', 200], ['/%6Aoin', 200], ['/%256Aoin', 404], ['/%E0%A4%A', 400], ['/join/', 301]]) await get(path, status);
  for (const result of [await get('/join', 200, { method: 'HEAD' }), await get('/join', 304, { headers: { 'If-None-Match': page.headers.get('etag') } })]) assert.equal(result.body, '');
  const asset = page.body.match(/href="(\/_astro\/[^"<>]+\.css)"/)?.[1];
  assert.ok(asset, 'the built page must include its hashed stylesheet');
  const stylesheet = await get(asset, 200);
  assert.match(stylesheet.headers.get('cache-control'), /max-age=31536000/);
  assert.match(stylesheet.headers.get('cache-control'), /immutable/);
  assert.match(stylesheet.headers.get('content-type'), /text\/css/);
  console.log('Node static aliases, malformed URLs, HEAD, 304 and immutable assets retain security headers.');
}
