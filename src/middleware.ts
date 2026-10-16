import { defineMiddleware } from 'astro:middleware';
import { getSiteConfig, isUtilityRoute } from './lib/seo/metadata';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const pathname = context.url.pathname;
  const jobboard = pathname === '/jobs' || pathname.startsWith('/jobs/') || pathname.startsWith('/api/jobboard/');
  const preview = !getSiteConfig().indexable;
  const noindex = preview || context.locals.seoNoindex || response.status >= 400 || isUtilityRoute(pathname);
  if (!jobboard && !noindex) return response;
  const headers = new Headers(response.headers);
  if (jobboard) {
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    if (!headers.has('Referrer-Policy')) headers.set('Referrer-Policy', 'strict-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
  }
  if (noindex) {
    const nofollow = preview || (headers.get('X-Robots-Tag') || '').toLowerCase().split(/[\s,]+/).includes('nofollow');
    headers.set('X-Robots-Tag', nofollow ? 'noindex, nofollow' : 'noindex, follow');
  }
  // Redirect responses may have immutable headers; preserve their body and status.
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
