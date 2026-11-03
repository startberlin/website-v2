import { autostart } from './node-autostart.mjs';
import { handler as nativeHandler, options, startServer as nativeStartServer } from '@astrojs/node/server.js';
import { applyNodeSecurityHeaders } from '../lib/security/headers.mjs';

if (autostart === undefined) delete process.env.ASTRO_NODE_AUTOSTART;
else process.env.ASTRO_NODE_AUTOSTART = autostart;

export { options };
export const handler = (request, response, next) => {
  applyNodeSecurityHeaders(response);
  return nativeHandler(request, response, next);
};

export function startServer() {
  const instance = nativeStartServer();
  // The native standalone server creates its own handler. Install before the first I/O turn.
  instance.server.server.prependListener('request', (_request, response) => applyNodeSecurityHeaders(response));
  return instance;
}

if (options.mode === 'standalone' && autostart !== 'disabled') {
  const { done } = startServer();
  done.catch((error) => { console.error(error); process.exit(1); });
}
