import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro/package.json'));
const viteRequire = createRequire(astroRequire.resolve('vite'));
const postcssRequire = createRequire(viteRequire.resolve('postcss'));
const { SourceMapConsumer, SourceNode } = postcssRequire('source-map-js');
const vercelRequire = createRequire(require.resolve('@astrojs/vercel/package.json'));
const routing = vercelRequire('@vercel/routing-utils');
const remote = await import(pathToFileURL(join(dirname(require.resolve('astro/package.json')), 'dist/assets/build/remote.js')));

const flatMap = { version: 3, sources: ['input.js'], names: [], mappings: 'AAAA', sourcesContent: ['x'] };
const indexedMap = (line, column = 0, map = flatMap) => ({ version: 3, sections: [{ offset: { line, column }, map }] });

test('indexed source maps reject huge or invalid offsets in object and JSON inputs', () => {
  for (const map of [indexedMap(1e12), indexedMap(-1), indexedMap(1.5), indexedMap('1'), indexedMap(0, -1)]) {
    assert.throws(() => new SourceMapConsumer(map), /Section offset/);
    assert.throws(() => new SourceMapConsumer(JSON.stringify(map)), /Section offset/);
  }
  assert.throws(() => new SourceMapConsumer(indexedMap(Infinity)), /Section offset/);
  assert.throws(() => new SourceMapConsumer(indexedMap(0, NaN)), /Section offset/);
});

test('nested source-map sections cannot bypass the cumulative offset bound', () => {
  const map = indexedMap(6_000_000, 0, indexedMap(6_000_000));
  assert.throws(() => new SourceMapConsumer(map), /including offsets of nested sections/);
  assert.throws(() => new SourceMapConsumer(JSON.stringify(map)), /including offsets of nested sections/);
});

test('ordinary indexed maps retain generated code and original source locations', () => {
  const consumer = new SourceMapConsumer(indexedMap(1));
  const mappings = [];
  consumer.eachMapping((mapping) => mappings.push(mapping));
  assert.deepEqual(mappings, [{
    source: 'input.js', generatedLine: 2, generatedColumn: 0, originalLine: 1, originalColumn: 0, name: null,
  }]);
  assert.equal(SourceNode.fromStringWithSourceMap('\nx', consumer).toString(), '\nx');
});

test('Vercel routing rejects adversarial multi-parameter paths without blocking', () => {
  const { src } = routing.sourceToRegex('/:a-:b');
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const expression = new RegExp(process.argv[1]);
    for (const separator of ['-a', '--']) {
      assert.equal(expression.test('/a' + separator.repeat(100_000) + '/a'), false);
    }
  `, src], { encoding: 'utf8', timeout: 3000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});

test('Vercel routing preserves normal parameters and redirect destinations', () => {
  const role = new RegExp(routing.sourceToRegex('/jobs/:id/:slug').src);
  assert.equal(role.test('/jobs/job-example/product-intern'), true);
  assert.equal(role.test('/jobs/job-example'), false);
  assert.equal(new RegExp(routing.sourceToRegex('/:a-:b').src).test('/berlin-start'), true);
  const result = routing.getTransformedRoutes({ redirects: [{ source: '/legal/:page.html', destination: '/:page', permanent: true }] });
  assert.equal(result.error, null);
  const [redirect] = result.routes;
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.Location, '/$1');
  assert.equal(new RegExp(redirect.src).test('/legal/privacy-policy.html'), true);
});

test('Astro image caching preserves public freshness and zero lifetimes for private responses', async () => {
  const url = 'https://images.example/photo.png';
  for (const headers of [
    { 'cache-control': 'public, max-age=600' },
    { 'cache-control': 'private, max-age=600', 'set-cookie': 'synthetic=session' },
    { 'cache-control': 'max-age=600', 'set-cookie': 'synthetic=session' },
  ]) {
    const before = Date.now();
    const result = await remote.loadRemoteImage(url, async (request) => {
      assert.equal(request.headers.has('cache-control'), false);
      return new Response('image bytes', { headers });
    });
    assert.equal(result.data.toString(), 'image bytes');
    if (headers['cache-control'].startsWith('public')) assert.ok(result.expires > before + 590_000);
    else assert.ok(result.expires <= Date.now());
  }
});
