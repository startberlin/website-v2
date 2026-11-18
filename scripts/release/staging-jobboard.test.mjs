import assert from 'node:assert/strict';
import test from 'node:test';
import { assertStagingJobboard } from './staging-jobboard.mjs';

const staging = {
  COCKPIT_API_URL: 'https://staging.cockpit.start-berlin.com/api/jobboard/v1',
  JOBBOARD_READ_API_KEY: 'r'.repeat(32),
  JOBBOARD_SUBMIT_API_KEY: 's'.repeat(32),
  JOBBOARD_METRICS_ENABLED: 'true',
  JOBBOARD_METRICS_API_KEY: 'm'.repeat(32),
};

test('only the dedicated staging upstream and distinct credentials qualify for staging Jobs', () => {
  assert.doesNotThrow(() => assertStagingJobboard(staging));
  assert.doesNotThrow(() => assertStagingJobboard({ ...staging, JOBBOARD_METRICS_ENABLED:'false', JOBBOARD_METRICS_API_KEY:undefined }));
  for (const invalid of [
    { JOBBOARD_METRICS_ENABLED: 'unexpected' },
    { JOBBOARD_METRICS_API_KEY: undefined },
    { JOBBOARD_METRICS_API_KEY: 'secret '.repeat(10).trim() },
    { JOBBOARD_METRICS_API_KEY: 'm'.repeat(513) },
    { JOBBOARD_METRICS_API_KEY: staging.JOBBOARD_READ_API_KEY },
    { COCKPIT_API_URL: 'https://cockpit.start-berlin.com/api/jobboard/v1' },
    { JOBBOARD_SUBMIT_API_KEY: undefined },
    { JOBBOARD_SUBMIT_API_KEY: staging.JOBBOARD_READ_API_KEY },
    { JOBBOARD_READ_API_KEY: 'short' },
  ]) assert.throws(() => assertStagingJobboard({ ...staging, ...invalid }));
});
