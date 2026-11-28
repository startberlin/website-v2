import type { APIRoute } from 'astro';
import { getSiteConfig } from '../lib/seo/metadata';
import { sitemapPages } from '../lib/seo/pages';
import { sitemapXml, xmlResponse } from '../lib/seo/sitemap';

export const prerender = false;
export const GET: APIRoute = () => {
  const config = getSiteConfig();
  return xmlResponse(sitemapXml(config.indexable ? sitemapPages() : [], config.origin));
};
