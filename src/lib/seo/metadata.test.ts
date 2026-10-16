import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMetadata, canonicalUrl, isJobFilterUrl, pageGraph, safeJsonLd, textSnippet } from './metadata';
import { validatePageInventory } from './contract';
import { pageDefinitions, pageSeo, sitemapPages } from './pages';
import { resolveSiteConfig, siteIdentity } from './site.mjs';

const production = resolveSiteConfig({ PUBLIC_SITE_URL: siteIdentity.defaultOrigin, SITE_INDEXABLE: 'true' });

test('indexing is opt-in, requires a public origin and cannot override provider previews', () => {
  assert.equal(resolveSiteConfig().indexable, false);
  assert.equal(production.indexable, true);
  for (const environment of [
    { SITE_INDEXABLE: 'true' },
    { SITE_INDEXABLE: 'true', PUBLIC_SITE_URL: 'http://127.0.0.1:4321' },
    { SITE_INDEXABLE: 'yes' },
    { PUBLIC_SITE_URL: 'https://example.com/path' },
    { PUBLIC_SITE_URL: 'https://user:secret@example.com' },
  ]) assert.throws(() => resolveSiteConfig(environment));
  for (const environment of [{ VERCEL_ENV: 'preview' }, { VERCEL_ENV: 'development' }, { CONTEXT: 'deploy-preview' }]) {
    assert.equal(resolveSiteConfig({ PUBLIC_SITE_URL: siteIdentity.defaultOrigin, SITE_INDEXABLE: 'true', ...environment }).indexable, false);
  }
});

test('canonical URLs remove tracking, hashes and trailing slash without accepting external hosts', () => {
  assert.equal(canonicalUrl('/members/?season=26%2F27&utm_source=test#board', production.origin), `${production.origin}/members`);
  assert.equal(canonicalUrl('/', production.origin), `${production.origin}/`);
  assert.equal(canonicalUrl('/jobs/id/role%20name', production.origin), `${production.origin}/jobs/id/role%20name`);
  for (const value of ['https://evil.example/', '//evil.example/', '/\\evil.example/']) assert.throws(() => canonicalUrl(value, production.origin));
});

test('shared metadata and graph agree and preview/error policies take precedence', () => {
  const seo = pageSeo('/members');
  const metadata = buildMetadata(seo, production);
  const graph = pageGraph(seo, metadata, production.origin)!;
  assert.equal(metadata.canonical, `${production.origin}/members`);
  assert.equal(metadata.title, 'Members and departments | START Berlin');
  assert.equal(metadata.noindex, false);
  assert.equal(graph['@graph'][2].url, metadata.canonical);
  assert.equal(graph['@graph'][2]['@type'], 'CollectionPage');
  assert.equal(graph['@graph'][0]['@id'], `${production.origin}/#organization`);
  assert.match(metadata.robots, /max-image-preview:large/);
  assert.equal(buildMetadata(seo, resolveSiteConfig()).noindex, true);
  assert.equal(buildMetadata(pageSeo('/jobs/submit'), production).noindex, true);
  const error = buildMetadata(seo, production, 503);
  assert.equal(error.noindex, true);
  assert.equal(error.canonical, undefined);
  assert.equal(pageGraph(seo, error, production.origin), null);
});

test('structured-data extensions retain facts, breadcrumbs and safe script serialization', () => {
  const seo = {
    ...pageSeo('/join'),
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Join', path: '/join' }],
    structuredData: [{ '@type': 'Article', headline: '</script><script>alert(1)</script>&\u2028\u2029' }],
  };
  const graph = pageGraph(seo, buildMetadata(seo, production), production.origin)!;
  const trail = graph['@graph'].find((node) => node['@type'] === 'BreadcrumbList')!;
  assert.deepEqual(trail.itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${production.origin}/` },
    { '@type': 'ListItem', position: 2, name: 'Join', item: `${production.origin}/join` },
  ]);
  const encoded = safeJsonLd(graph);
  assert.doesNotMatch(encoded, /<|>|&|\u2028|\u2029/);
  assert.deepEqual(JSON.parse(encoded), graph);
});

test('the page inventory rejects unregistered routes, stale entries and copied metadata', () => {
  const routes = Object.keys(pageDefinitions);
  assert.deepEqual(validatePageInventory(pageDefinitions, routes), []);
  assert.match(validatePageInventory(pageDefinitions, [...routes, '/new-page']).join('\n'), /new-page.*add SEO/);
  assert.match(validatePageInventory(pageDefinitions, routes.filter((route) => route !== '/join')).join('\n'), /join.*no implemented/);
  const copied = { ...pageDefinitions, '/new-page': { ...pageSeo('/join'), canonicalPath: '/new-page' } };
  assert.match(validatePageInventory(copied, [...routes, '/new-page']).join('\n'), /unique title/);
  assert.deepEqual(sitemapPages().sort(), ['/', '/jobs', '/join', '/legal-notice', '/members', '/privacy-policy',
    '/members/antonia-hill', '/members/julia-palm', '/members/kari-pele-streithoff', '/members/tobias-burger',
    '/members/jannik-schaefer', '/members/anna-brinkkoetter', '/members/rhema-tamunoiyowuna', '/members/rocco-yohji-matthew-krippendorff'].sort());
});

test('job filters are excluded while attribution remains canonicalised, and snippets use word boundaries', () => {
  for (const key of ['q', 'type', 'mode', 'location', 'page']) assert.equal(isJobFilterUrl(new URLSearchParams(`${key}=value`)), true);
  assert.equal(isJobFilterUrl(new URLSearchParams('source=linkedin&utm_campaign=jobs')), false);
  assert.equal(textSnippet('  A\n role   in Berlin  '), 'A role in Berlin');
  assert.equal(textSnippet('Build useful products with our team in Berlin', 24), 'Build useful products');
});
