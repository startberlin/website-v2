// Shared by SSR, the Node HTTP boundary and Vercel's static-file routing.
export const securityHeaders = Object.freeze({
  'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY',
});

/** @param {Headers} headers */
export function applySecurityHeaders(headers) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    // Multiple CSP policies are enforced together. Retain any route-specific restrictions.
    if (name === 'Content-Security-Policy' && headers.has(name) && headers.get(name) !== value) headers.append(name, value);
    else headers.set(name, value);
  }
  return headers;
}

/** @param {import('node:http').ServerResponse} response */
export function applyNodeSecurityHeaders(response) {
  for (const [name, value] of Object.entries(securityHeaders)) response.setHeader(name, value);
}
