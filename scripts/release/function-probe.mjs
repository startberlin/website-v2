import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { once } from 'node:events';

const app = (await import(pathToFileURL(process.argv[2]).href)).default;
let server;
try {
  let response;
  if (typeof app?.fetch === 'function') response = await app.fetch(new Request('http://127.0.0.1/api/health'));
  else if (typeof app === 'function') {
    server = createServer(app);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`, { signal: AbortSignal.timeout(10_000), redirect: 'manual' });
  } else throw new Error('Unsupported packaged Node function export.');
  console.log(JSON.stringify({ status: response.status, cache: response.headers.get('cache-control'), identity: response.status === 200 ? await response.json() : null }));
} finally { if (server) await new Promise(resolve => server.close(resolve)); }
