import { spawnSync } from 'node:child_process';
import { createPlan } from './plan.mjs';

const kind = process.argv[2] || 'tests';
const plan = process.env.CI_PLAN ? JSON.parse(process.env.CI_PLAN) : createPlan(process.cwd(), [], { full: true });
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
if (kind === 'quality') for (const name of plan.quality) run('pnpm', ['--config.verify-deps-before-run=false', 'run', name]);
else if (kind === 'tests') {
  if (plan.nativeTests.length) run(process.execPath, ['--import', 'tsx', '--test', ...plan.nativeTests]);
  for (const name of plan.customTests) run('pnpm', ['--config.verify-deps-before-run=false', 'run', name]);
  if (!plan.tests) console.log('No behaviour tests affected by this change.');
} else throw new Error(`Unknown verification category: ${kind}`);
