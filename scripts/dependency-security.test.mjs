import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import * as nodeFs from 'node:fs';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro/package.json'));
const viteRequire = createRequire(astroRequire.resolve('vite'));
const postcssRequire = createRequire(viteRequire.resolve('postcss'));
const { SourceMapConsumer, SourceNode } = postcssRequire('source-map-js');
const vercelRequire = createRequire(require.resolve('@astrojs/vercel/package.json'));
const routing = vercelRequire('@vercel/routing-utils');
const remote = await import(pathToFileURL(join(dirname(require.resolve('astro/package.json')), 'dist/assets/build/remote.js')));
const nftRequire = createRequire(vercelRequire.resolve('@vercel/nft'));
const { nodeFileTrace } = vercelRequire('@vercel/nft');
const { glob } = nftRequire('glob');
const globRequire = createRequire(nftRequire.resolve('glob'));
const resolverRequire = createRequire(require.resolve('@hookform/resolvers'));
const ajvRequire = createRequire(resolverRequire.resolve('ajv'));
const uri = ajvRequire('fast-uri');
const { z } = require('zod');

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

test('oversized Zod containers fail before parsing their elements', async () => {
  let parsed = 0;
  const value = z.string().transform((input) => { parsed++; return input; });
  for (const [schema, input, control] of [
    [z.array(value).max(2), Array(2000).fill('value'), ['a', 'b']],
    [z.set(value).max(2), new Set(Array.from({ length: 2000 }, (_, index) => String(index))), new Set(['a', 'b'])],
    [z.map(z.string(), value).max(2), new Map(Array.from({ length: 2000 }, (_, index) => [String(index), 'value'])), new Map([['key', 'value']])],
  ]) {
    parsed = 0;
    const result = await schema.safeParseAsync(input);
    assert.equal(result.success, false);
    assert.equal(parsed, 0, 'oversized input must not run element transforms');
    assert.ok(result.error.issues.some((issue) => issue.code === 'too_big'));
    assert.equal(schema.safeParse(control).success, true);
    assert.ok(parsed > 0, 'ordinary inputs retain element parsing');
  }
});

test('URI normalization cannot promote encoded scheme tokens to executable schemes', () => {
  for (const input of ['%6Aavascript:alert(1)', '%u006Aavascript:alert(1)', '%64ata:text/html,test', '%76bscript:msgbox(1)']) {
    const parsed = uri.parse(input);
    assert.ok(parsed.error || !/^(javascript|data|vbscript)$/i.test(parsed.scheme || ''));
    for (const operation of [() => uri.normalize(input), () => uri.resolve('https://example.com/base/', input)]) {
      try { assert.doesNotMatch(operation(), /^(javascript|data|vbscript):/i); }
      catch (error) {
        if (!(error instanceof URIError || error instanceof TypeError ||
          (error instanceof Error && error.message === 'URI scheme is malformed.'))) throw error;
      }
    }
  }
  assert.equal(uri.equal('%68ttp://example.com/', 'http://example.com/'), false);
  assert.equal(uri.resolve('https://example.com/base/', '../role'), 'https://example.com/role');
  assert.equal(uri.parse('https://example.com/role').scheme, 'https');
});

test('aborted glob traversal stops starting additional directory reads', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'website-glob-abort-'));
  try {
    for (let parent = 0; parent < 8; parent++) {
      for (let child = 0; child < 8; child++) {
        const leaf = join(directory, String(parent), String(child));
        await mkdir(leaf, { recursive: true });
        await writeFile(join(leaf, 'asset.dat'), 'fixture');
      }
    }
    const controller = new AbortController();
    let reads = 0;
    const instrumentedFs = {
      ...nodeFs,
      readdir(...args) {
        reads++;
        if (reads === 1) controller.abort(new Error('fixture abort'));
        return nodeFs.readdir(...args);
      },
    };
    await assert.rejects(glob('**/*', { cwd: directory, fs: instrumentedFs, signal: controller.signal }), /fixture abort/);
    const settledReads = reads;
    await delay(50);
    assert.equal(reads, settledReads, 'a rejected walk must not continue its filesystem work');
    assert.equal((await glob('**/*.dat', { cwd: directory, nodir: true })).length, 64);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('recursive-parent glob optimization respects its expansion budget', () => {
  const result = spawnSync(process.execPath, ['--max-old-space-size=64', '-e', `
    const assert = require('node:assert/strict');
    const { Minimatch } = require(process.argv[1]);
    for (const pattern of [('a/**/../').repeat(30) + '*.cjs', ('**/../').repeat(30) + '*.json']) {
      const matcher = new Minimatch(pattern, { optimizationLevel: 2, braceExpandMax: 256 });
      assert.ok(matcher.set.length <= 256);
      assert.equal(matcher.match('ordinary.cjs'), false);
    }
    if (!new Minimatch('parts/*.cjs').match('parts/direct.cjs')) process.exit(2);
  `, globRequire.resolve('minimatch')], { encoding: 'utf8', timeout: 3000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});

test('Vercel NFT preserves dynamic dependency tracing with the patched glob major', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'website-nft-security-'));
  try {
    await mkdir(join(directory, 'parts'));
    await writeFile(join(directory, 'entry.cjs'), "module.exports = name => require('./parts/' + name + '.cjs');\n");
    for (const name of ['first', 'second']) await writeFile(join(directory, 'parts', name + '.cjs'), 'module.exports = 1;\n');
    const result = await nodeFileTrace([join(directory, 'entry.cjs')], { base: directory, processCwd: directory });
    for (const file of ['entry.cjs', 'parts/first.cjs', 'parts/second.cjs']) assert.ok(result.fileList.has(file), file);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
