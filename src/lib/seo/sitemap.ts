import { canonicalUrl } from './metadata';

export function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
export function sitemapXml(paths: string[], origin: string): string {
  const entries = [...new Set(paths)].map((path) => `<url><loc>${escapeXml(canonicalUrl(path, origin))}</loc></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}
export function sitemapIndexXml(paths: string[], origin: string): string {
  const entries = paths.map((path) => `<sitemap><loc>${escapeXml(canonicalUrl(path, origin))}</loc></sitemap>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}
export function xmlResponse(xml: string): Response {
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
}
