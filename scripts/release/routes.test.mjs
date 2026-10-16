import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pageRoutes } from './routes.mjs';

test('smoke coverage follows new pages without inventing parameterised routes or error-page URLs', () => {
  const root = mkdtempSync(join(tmpdir(), 'website-pages-'));
  try {
    for (const file of ['index.astro', 'new-page.astro', 'jobs/index.astro', 'jobs/[id]/[slug].astro', '404.astro', '_private/demo.astro']) {
      const path = join(root, file); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, '');
    }
    assert.deepEqual(pageRoutes(root), ['/', '/jobs', '/new-page']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
