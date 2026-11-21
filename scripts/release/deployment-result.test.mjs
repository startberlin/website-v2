import assert from 'node:assert/strict';
import test from 'node:test';
import { deploymentResult } from './deployment-result.mjs';

const deployment = () => ({ id: 'dpl_ready123', url: 'https://website-v2-checked.vercel.app', readyState: 'READY', target: null });
test('Vercel non-interactive JSON resolves the exact ready Preview or Production URL', () => {
  assert.deepEqual(deploymentResult({ status: 'ok', deployment: deployment() }, 'preview'), { id: 'dpl_ready123', url: 'https://website-v2-checked.vercel.app' });
  assert.doesNotThrow(() => deploymentResult({ ...deployment(), target: 'production' }, 'production'));
});
test('an implicit Production first deployment cannot pass as a PR preview', () => {
  assert.throws(() => deploymentResult({ status: 'ok', deployment: { ...deployment(), target: 'production' } }, 'preview'));
  assert.throws(() => deploymentResult(deployment(), 'production'));
});
test('incomplete responses and forged origins cannot assign a domain', () => {
  for (const change of [{ readyState: 'BUILDING' }, { readyState: 'ERROR' }, { url: 'https://outside.example' }, { url: 'https://token@website-v2-checked.vercel.app' }, { url: 'https://website-v2-checked.vercel.app/not-root' }, { id: 'dpl_fake\ninjected=yes' }]) {
    assert.throws(() => deploymentResult({ status: 'ok', deployment: { ...deployment(), ...change } }, 'preview'));
  }
  assert.throws(() => deploymentResult({ status: 'action_required', deployment: deployment() }, 'preview'));
});
