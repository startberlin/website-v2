import assert from 'node:assert/strict';
import test from 'node:test';
import { assertPreviewVariables } from './preview-env.mjs';

test('new public config is allowed while previews reject service credentials even on main', () => {
  const variable = { target: ['preview'], gitBranch: null, type: 'plain', key: 'A_NEW_PUBLIC_OPTION' };
  assert.doesNotThrow(() => assertPreviewVariables([variable]));
  assert.doesNotThrow(() => assertPreviewVariables([{ ...variable, key: 'PUBLIC_SITE_URL', type: 'encrypted' }]));
  assert.throws(() => assertPreviewVariables([{ ...variable, key: 'A_NEW_API_KEY' }]));
  assert.throws(() => assertPreviewVariables([{ ...variable, key: 'PRIVATE_DATA', type: 'encrypted' }]));
  assert.throws(() => assertPreviewVariables([{ ...variable, key: 'SERVICE_TOKEN', gitBranch: 'feature' }]));
  assert.throws(() => assertPreviewVariables([{ ...variable, key: 'SERVICE_TOKEN', type: 'encrypted', gitBranch: 'main' }]));
  assert.doesNotThrow(() => assertPreviewVariables([{ ...variable, key: 'SERVICE_TOKEN', type: 'encrypted', target: ['production'] }]));
});
