import { pathToFileURL } from 'node:url';

export function assertStagingJobboard(env) {
  if (env.COCKPIT_API_URL !== 'https://staging.cockpit.start-berlin.com/api/jobboard/v1') {
    throw new Error('Configure the dedicated staging Cockpit Jobs API origin.');
  }
  const keys = [env.JOBBOARD_READ_API_KEY, env.JOBBOARD_SUBMIT_API_KEY];
  if (!['true', 'false'].includes(env.JOBBOARD_METRICS_ENABLED)) {
    throw new Error('Set JOBBOARD_METRICS_ENABLED explicitly in the GitHub staging environment.');
  }
  if (env.JOBBOARD_METRICS_ENABLED === 'true') keys.push(env.JOBBOARD_METRICS_API_KEY);
  if (keys.some((key) => !key || !/^\S{32,512}$/.test(key)) || new Set(keys).size !== keys.length) {
    throw new Error('Configure distinct credentials for each enabled Jobs capability in the GitHub staging environment.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assertStagingJobboard(process.env);
}
