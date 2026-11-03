// Verify the HTTP contract independently of the policy used to generate headers.
export function assertSecurityHeaders(headers, path) {
  const csp = headers.get('content-security-policy') || '';
  for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) {
    if (!csp.split(/\s*[;,]\s*/).includes(directive)) throw new Error(`${path}: missing CSP directive ${directive}.`);
  }
  for (const [name, expected] of Object.entries({
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'DENY',
  })) {
    if (headers.get(name) !== expected) throw new Error(`${path}: incorrect ${name}.`);
  }
  const permissions = (headers.get('permissions-policy') || '').split(/\s*,\s*/);
  for (const permission of ['camera=()', 'microphone=()', 'geolocation=()']) {
    if (!permissions.includes(permission)) throw new Error(`${path}: missing permission restriction ${permission}.`);
  }
}
