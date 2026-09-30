import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = context.url.pathname;
	if (pathname !== '/jobs' && !pathname.startsWith('/jobs/') && !pathname.startsWith('/api/jobboard/')) {
		return next();
	}
	const response = await next();
	const headers = new Headers(response.headers);
	headers.set('Cache-Control', 'no-store');
	headers.set('X-Content-Type-Options', 'nosniff');
	if (!headers.has('Referrer-Policy')) headers.set('Referrer-Policy', 'strict-origin');
	headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	headers.set('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
