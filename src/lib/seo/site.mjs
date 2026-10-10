export const siteIdentity = {
  name: 'START Berlin',
  legalName: 'START Berlin e.V.',
  defaultOrigin: 'https://www.start-berlin.com',
  language: 'en-GB',
  locale: 'en_GB',
  description: 'A student-led entrepreneurship community in Berlin connecting students with the startup ecosystem.',
  logo: { path: '/social/start-berlin-logo.png', width: 678, height: 310, type: 'image/png' },
  socialImage: {
    path: '/social/start-berlin.jpg', width: 1200, height: 630, type: 'image/jpeg',
    alt: 'Group photo of START Berlin members.',
  },
  sameAs: [
    'https://www.instagram.com/start_berlin',
    'https://www.linkedin.com/company/start-berlin-e-v-',
    'https://www.tiktok.com/@start_berlin',
  ],
};

/** Accept exact origins only. Never construct public URLs from an incoming Host header. */
/** @param {string} value */
export function validateSiteOrigin(value) {
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
    !['http:', 'https:'].includes(url.protocol) || (url.protocol === 'http:' && !local)
  ) throw new Error('PUBLIC_SITE_URL requires an exact HTTPS origin, or local HTTP for development.');
  return url.origin;
}

/** Builds are private previews unless indexing is explicitly enabled for a public origin. */
/** @param {{ PUBLIC_SITE_URL?: string, SITE_INDEXABLE?: string, VERCEL_ENV?: string, CONTEXT?: string }} environment */
export function resolveSiteConfig(environment = {}) {
  const origin = validateSiteOrigin(environment.PUBLIC_SITE_URL || siteIdentity.defaultOrigin);
  if (environment.SITE_INDEXABLE && !['true', 'false'].includes(environment.SITE_INDEXABLE)) {
    throw new Error('SITE_INDEXABLE must be true or false.');
  }
  const preview = (environment.VERCEL_ENV && environment.VERCEL_ENV !== 'production') ||
    (environment.CONTEXT && environment.CONTEXT !== 'production');
  const indexable = environment.SITE_INDEXABLE === 'true' && !preview;
  if (indexable && (!environment.PUBLIC_SITE_URL || new URL(origin).protocol !== 'https:' ||
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname))) {
    throw new Error('Indexing requires an explicit public HTTPS PUBLIC_SITE_URL.');
  }
  return { origin, indexable };
}
