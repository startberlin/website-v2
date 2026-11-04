import { defineMiddleware } from 'astro:middleware';
import { getSiteConfig, isUtilityRoute } from './lib/seo/metadata';
import { applySecurityHeaders } from './lib/security/headers.mjs';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const pathname = context.url.pathname;
  const jobboard = pathname === '/jobs' || pathname.startsWith('/jobs/') || pathname.startsWith('/api/jobboard/');
  const preview = !getSiteConfig().indexable;
  const noindex = preview || context.locals.seoNoindex || response.status >= 400 || isUtilityRoute(pathname);
  const headers = applySecurityHeaders(new Headers(response.headers));
  if (jobboard) {
    headers.set('Cache-Control', 'no-store');
  }
  if (noindex) {
    const nofollow = preview || (headers.get('X-Robots-Tag') || '').toLowerCase().split(/[\s,]+/).includes('nofollow');
    headers.set('X-Robots-Tag', nofollow ? 'noindex, nofollow' : 'noindex, follow');
  }
  // Redirect responses may have immutable headers; preserve their body and status.
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
