import assert from 'node:assert/strict';
import test from 'node:test';
import { GET as robots } from '../../pages/robots.txt';
import { GET as index } from '../../pages/sitemap.xml';
import { GET as pages } from '../../pages/sitemap-pages.xml';
import { GET as jobs } from '../../pages/jobs/sitemap.xml';
import { escapeXml, sitemapXml } from './sitemap';

async function configured(indexable: boolean, run: () => Promise<void>) {
  const keys = ['PUBLIC_SITE_URL', 'SITE_INDEXABLE', 'VERCEL_ENV', 'CONTEXT'] as const;
  const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const fetchBefore = globalThis.fetch;
  process.env.PUBLIC_SITE_URL = 'https://www.start-berlin.com';
  process.env.SITE_INDEXABLE = String(indexable);
  delete process.env.VERCEL_ENV;
  delete process.env.CONTEXT;
  try { await run(); } finally {
    globalThis.fetch = fetchBefore;
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
}
const context = { request: new Request('https://untrusted-preview.example/') } as never;

test('production discovery uses the configured origin, excludes utilities and has no fabricated freshness', async () => {
  await configured(true, async () => {
    const directives = await (await robots(context)).text();
    assert.match(directives, /User-agent: \*\nAllow: \//);
    assert.match(directives, /Sitemap: https:\/\/www.start-berlin.com\/sitemap.xml/);
    assert.doesNotMatch(directives, /untrusted-preview/);
    const discovery = await (await index(context)).text();
    assert.match(discovery, /<sitemapindex/);
    assert.match(discovery, /\/sitemap-pages.xml/);
    assert.match(discovery, /\/jobs\/sitemap.xml/);
    const response = await pages(context);
    assert.equal(response.headers.get('content-type'), 'application/xml; charset=utf-8');
    const xml = await response.text();
    assert.equal((xml.match(/<url>/g) ?? []).length, 14);
    assert.match(xml, /\/members\/rhema-tamunoiyowuna/);
    assert.match(xml, /\/members\/jannik-schaefer/);
    assert.match(xml, /\/members\/antonia-hill/);
    assert.match(xml, /\/members\/anna-brinkkoetter/);
    assert.doesNotMatch(xml, /submit|jobs\/privacy|\/404|lastmod|priority|changefreq/);
  });
});

test('previews expose no sitemap entries and never contact Cockpit for discovery', async () => {
  await configured(false, async () => {
    globalThis.fetch = async () => { throw new Error('Preview sitemap must not fetch jobs.'); };
    assert.equal(await (await robots(context)).text(), 'User-agent: *\nDisallow: /\n');
    for (const endpoint of [index, pages, jobs]) {
      const response = await endpoint(context);
      assert.equal(response.status, 200);
      assert.doesNotMatch(await response.text(), /<loc>/);
    }
  });
});

test('XML escapes content and deduplicates canonical entries', () => {
  assert.equal(escapeXml('<&>"\''), '&lt;&amp;&gt;&quot;&apos;');
  assert.equal((sitemapXml(['/join', '/join'], 'https://example.com').match(/<url>/g) ?? []).length, 1);
});
