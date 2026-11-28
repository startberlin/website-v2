import type { APIRoute } from 'astro';
import { canonicalUrl, getSiteConfig } from '../lib/seo/metadata';

export const prerender = false;
export const GET: APIRoute = () => {
  const config = getSiteConfig();
  const body = config.indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${canonicalUrl('/sitemap.xml', config.origin)}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
};
