import { autostart } from './node-autostart.mjs';
import { handler as nativeHandler, options, startServer as nativeStartServer } from '@astrojs/node/server.js';
import { applyNodeSecurityHeaders } from '../lib/security/headers.mjs';
import { resolveSiteConfig } from '../lib/seo/site.mjs';

if (autostart === undefined) delete process.env.ASTRO_NODE_AUTOSTART;
else process.env.ASTRO_NODE_AUTOSTART = autostart;

function prepareResponse(request, response) {
  applyNodeSecurityHeaders(response);
  // The native standalone handler would serve the prerendered homepage at this URL.
  if (request.url?.split('?', 1)[0] !== '/index.html') return false;
  const { search } = new URL(request.url, 'http://127.0.0.1');
  if (!resolveSiteConfig(process.env).indexable) response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  response.writeHead(301, { Location: `/${search}` });
  response.end();
  return true;
}

export { options };
export const handler = (request, response, next) => {
  if (prepareResponse(request, response)) return;
  return nativeHandler(request, response, next);
};

export function startServer() {
  const instance = nativeStartServer();
  const server = instance.server.server;
  const [listener] = server.listeners('request');
  server.off('request', listener);
  server.on('request', (request, response) => {
    if (!prepareResponse(request, response)) listener.call(server, request, response);
  });
  return instance;
}

if (options.mode === 'standalone' && autostart !== 'disabled') {
  const { done } = startServer();
  done.catch((error) => { console.error(error); process.exit(1); });
}
