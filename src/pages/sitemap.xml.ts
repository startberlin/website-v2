import type { APIRoute } from 'astro';
import { getSiteConfig } from '../lib/seo/metadata';
import { sitemapIndexXml, xmlResponse } from '../lib/seo/sitemap';

export const prerender = false;
export const GET: APIRoute = () => {
  const config = getSiteConfig();
  return xmlResponse(sitemapIndexXml(config.indexable ? ['/sitemap-pages.xml', '/jobs/sitemap.xml'] : [], config.origin));
};
