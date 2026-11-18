import { pathToFileURL } from 'node:url';

export function assertStagingJobboard(env) {
  if (env.COCKPIT_API_URL !== 'https://staging.cockpit.start-berlin.com/api/jobboard/v1') {
    throw new Error('Configure the dedicated staging Cockpit Jobs API origin.');
  }
  const keys = [env.JOBBOARD_READ_API_KEY, env.JOBBOARD_SUBMIT_API_KEY];
  if (keys.some((key) => !key || key.trim() !== key || key.length < 32) || keys[0] === keys[1]) {
    throw new Error('Configure distinct Jobs read and submit credentials in the GitHub staging environment.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assertStagingJobboard(process.env);
}
