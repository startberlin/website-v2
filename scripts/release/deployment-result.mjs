import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function deploymentResult(data, expectedTarget) {
  if (data.status && data.status !== 'ok') throw new Error('Vercel did not report a completed deployment.');
  const deployment = data.deployment || data;
  if (deployment.readyState !== 'READY' || !/^dpl_[a-zA-Z0-9]+$/.test(deployment.id || '')) throw new Error('Vercel has no ready deployment identity.');
  const url = new URL(deployment.url);
  if (url.protocol !== 'https:' || !/^[a-zA-Z0-9-]+\.vercel\.app$/.test(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Vercel returned an unexpected deployment URL.');
  if (expectedTarget === 'preview' ? ![null, 'preview'].includes(deployment.target) : deployment.target !== 'production') throw new Error('Vercel deployed to a different environment than requested.');
  return { id: deployment.id, url: url.origin };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = deploymentResult(JSON.parse(readFileSync(process.argv[2], 'utf8')), process.argv[3]);
    appendFileSync(process.env.GITHUB_OUTPUT, `url=${result.url}\ndeployment_id=${result.id}\n`);
    console.log(`Verified ready ${process.argv[3]} deployment ${result.id}.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
