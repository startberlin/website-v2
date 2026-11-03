import assert from 'node:assert/strict';
import test from 'node:test';
import { applySecurityHeaders } from './headers.mjs';
import { assertSecurityHeaders, assertSecurityPolicyVersion } from '../../../scripts/release/security-headers.mjs';
import { securityPolicyVersion } from './policy-version.mjs';

test('baseline policy protects responses without changing cache or indexing decisions', () => {
  const headers = applySecurityHeaders(new Headers({ 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Robots-Tag': 'noindex, nofollow' }));
  assertSecurityHeaders(headers, '/asset.css');
  assert.equal(headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
  assert.equal(headers.get('X-Robots-Tag'), 'noindex, nofollow');
});

test('existing CSP restrictions and private redirect policy remain enforced', () => {
  const original = "default-src 'none'; base-uri 'none'";
  const headers = applySecurityHeaders(new Headers({ 'Content-Security-Policy': original, 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', Location: 'https://example.com/apply' }));
  assertSecurityHeaders(headers, '/jobs/apply/example');
  assert.ok(headers.get('Content-Security-Policy').startsWith(`${original}, `));
  assert.equal(headers.get('Cache-Control'), 'no-store');
  assert.equal(headers.get('Location'), 'https://example.com/apply');
});

test('release checks reject each missing security control and permissive variants', () => {
  const valid = applySecurityHeaders(new Headers());
  for (const name of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options']) {
    const missing = new Headers(valid);
    missing.delete(name);
    assert.throws(() => assertSecurityHeaders(missing, '/join'));
  }
  for (const [name, value] of [['Content-Security-Policy', "frame-ancestors *"], ['Referrer-Policy', 'unsafe-url'], ['Permissions-Policy', 'camera=*'], ['X-Frame-Options', 'SAMEORIGIN']]) {
    const permissive = new Headers(valid);
    permissive.set(name, value);
    assert.throws(() => assertSecurityHeaders(permissive, '/join'));
  }
});

test('release checks reject HTML that could retain an older cached security policy', () => {
  assert.throws(() => assertSecurityPolicyVersion('<meta name="generator" content="Astro">', '/join'));
  assert.throws(() => assertSecurityPolicyVersion(`<meta data-security-policy="${'0'.repeat(64)}">`, '/join'));
  const current = `<meta name="generator" data-security-policy="${securityPolicyVersion}">`;
  assert.doesNotThrow(() => assertSecurityPolicyVersion(current, '/join'));
  assert.throws(() => assertSecurityPolicyVersion(current + current, '/join'));
});
