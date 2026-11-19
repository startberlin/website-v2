import { autostart } from './node-autostart.mjs';
import { handler as nativeHandler, options, startServer as nativeStartServer } from '@astrojs/node/server.js';
import { applyNodeSecurityHeaders } from '../lib/security/headers.mjs';

if (autostart === undefined) delete process.env.ASTRO_NODE_AUTOSTART;
else process.env.ASTRO_NODE_AUTOSTART = autostart;

const legacyRedirects = new Map([
  ['/index.html', '/'],
  ['/for-students.html', '/member-journey'],
  ['/join-start-berlin.html', '/join'],
]);

function handleLegacyRedirect(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1');
  const target = legacyRedirects.get(url.pathname);
  if (!target) return false;
  applyNodeSecurityHeaders(response);
  const destination = target === '/' ? `/${url.search}` : `${target}${url.search}`;
  response.statusCode = 301;
  response.setHeader('Location', destination);
  response.end();
  return true;
}

export { options };
export const handler = (request, response, next) => {
  if (handleLegacyRedirect(request, response)) return;
  applyNodeSecurityHeaders(response);
  return nativeHandler(request, response, next);
};

export function startServer() {
  const instance = nativeStartServer();
  const raw = instance.server.server.rawListeners('request');
  instance.server.server.removeAllListeners('request');
  instance.server.server.on('request', (request, response) => {
    if (handleLegacyRedirect(request, response)) return;
    applyNodeSecurityHeaders(response);
    for (const listener of raw) listener.call(instance.server.server, request, response);
  });
  return instance;
}

if (options.mode === 'standalone' && autostart !== 'disabled') {
  const { done } = startServer();
  done.catch((error) => { console.error(error); process.exit(1); });
}
