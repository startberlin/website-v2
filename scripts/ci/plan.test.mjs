import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createPlan, affectedTests } from './plan.mjs';

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'website-ci-'));
  const files = {
    'package.json': JSON.stringify({ scripts: { typecheck: 'astro check', 'check:design': 'node design.mjs', 'check:seo': 'node seo.mjs', 'test:jobboard': 'node --import tsx --test src/jobs/*.test.ts', 'test:browser': 'playwright test' } }),
    'tsconfig.json': '{}',
    'src/shared.ts': 'export const label = "START";',
    'src/jobs/api.ts': 'export { label } from "../shared";',
    'src/jobs/api.test.ts': 'import test from "node:test"; import {label} from "./api";',
    'src/seo/meta.ts': 'export { label } from "../shared";',
    'src/seo/meta.test.ts': 'import test from "node:test"; import {label} from "./meta";',
    'src/style.css': 'body {}',
    'README.md': '# Website',
  };
  try {
    for (const [file, content] of Object.entries(files)) { mkdirSync(join(root, file, '..'), { recursive: true }); writeFileSync(join(root, file), content); }
    execFileSync('git', ['init', '-q'], { cwd: root });
    execFileSync('git', ['add', '.'], { cwd: root });
    run(root, Object.keys(files));
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test('a local logic change selects its dependent tests, including transitive imports', () => fixture((root, files) => {
  assert.deepEqual(affectedTests(root, files, ['src/jobs/api.ts']), ['src/jobs/api.test.ts']);
  assert.deepEqual(affectedTests(root, files, ['src/shared.ts']), ['src/jobs/api.test.ts', 'src/seo/meta.test.ts']);
}));
test('new tests and check scripts are discovered without a workflow edit', () => fixture((root, files) => {
  const added = 'src/seo/new.test.ts'; writeFileSync(join(root, added), 'import test from "node:test";');
  assert.deepEqual(affectedTests(root, [...files, added], [added]), [added]);
  const plan = createPlan(root, ['src/seo/meta.ts']);
  assert.deepEqual(plan.quality, ['check:design', 'check:seo', 'typecheck']);
  assert.deepEqual(plan.customTests, ['test:browser']);
}));
test('documentation skips runtime checks; styles build without unrelated unit tests', () => fixture(root => {
  const docs = createPlan(root, ['README.md']);
  assert.equal(docs.build, false); assert.equal(docs.tests, false); assert.deepEqual(docs.quality, []);
  const styles = createPlan(root, ['src/style.css']);
  assert.equal(styles.build, true); assert.deepEqual(styles.nativeTests, []); assert.deepEqual(styles.customTests, ['test:browser']);
}));
test('dependency changes and deleted runtime files conservatively select all tests', () => fixture(root => {
  const plan = createPlan(root, ['pnpm-lock.yaml']);
  assert.equal(plan.nativeTests.length, 2); assert.equal(plan.build, true);
  assert.equal(createPlan(root, ['src/jobs/api.ts'], { removed: true }).nativeTests.length, 2);
}));
test('computed local imports do not silently exclude a possibly affected test', () => fixture((root, files) => {
  writeFileSync(join(root, 'src/jobs/api.ts'), 'export const load = name => import(name);');
  assert.deepEqual(affectedTests(root, files, ['src/seo/meta.ts']), ['src/jobs/api.test.ts', 'src/seo/meta.test.ts']);
}));
