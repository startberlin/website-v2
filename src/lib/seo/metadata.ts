import { env } from 'node:process';
import { resolveSiteConfig, siteIdentity } from './site.mjs';
export { safeJsonLd } from './serialize';

export interface SeoImage {
  path: string;
  width: number;
  height: number;
  type: string;
  alt: string;
}

export interface Breadcrumb { name: string; path: string; }

export interface PageSeo {
  /** Page-specific title. The shared head adds the START Berlin suffix. */
  title: string;
  description: string;
  /** Site-relative canonical path. Use null for errors or a dynamic template without a record. */
  canonicalPath: string | null;
  noindex?: boolean;
  pageType?: 'WebPage' | 'AboutPage' | 'CollectionPage';
  image?: SeoImage;
  /** Only supply breadcrumbs that are also rendered as visible links. */
  breadcrumbs?: Breadcrumb[];
  structuredData?: Record<string, unknown>[];
}

export function getSiteConfig() {
  // Individual build variables let Astro substitute values in prerendered output.
  const buildEnvironment = {
    PUBLIC_SITE_URL: import.meta.env?.PUBLIC_SITE_URL,
    SITE_INDEXABLE: import.meta.env?.SITE_INDEXABLE,
    VERCEL_ENV: import.meta.env?.VERCEL_ENV,
    CONTEXT: import.meta.env?.CONTEXT,
  };
  return resolveSiteConfig({ ...buildEnvironment, ...env });
}

export function canonicalUrl(path: string, origin: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new Error('Canonical paths must be site-relative paths beginning with one slash.');
  }
  const url = new URL(path, origin);
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  url.search = '';
  url.hash = '';
  return url.href;
}

export function textSnippet(text: string, maxLength = 180): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const prefix = clean.slice(0, maxLength);
  const boundary = prefix.lastIndexOf(' ');
  return (boundary > 0 ? prefix.slice(0, boundary) : prefix).trim();
}

export function buildMetadata(seo: PageSeo, config: ReturnType<typeof resolveSiteConfig>, status = 200) {
  if (!seo?.title.trim() || !seo.description.trim()) {
    throw new Error('Every page requires a unique SEO title and description.');
  }
  const noindex = !config.indexable || Boolean(seo.noindex) || status >= 400;
  const canonical = seo.canonicalPath === null || status >= 400 ? undefined : canonicalUrl(seo.canonicalPath, config.origin);
  const image = seo.image ?? siteIdentity.socialImage;
  if (!image.alt.trim() || image.width <= 0 || image.height <= 0) {
    throw new Error('SEO images require dimensions and descriptive alt text.');
  }
  return {
    title: `${seo.title.trim()} | ${siteIdentity.name}`,
    description: seo.description.replace(/\s+/g, ' ').trim(), canonical,
    image: { ...image, url: canonicalUrl(image.path, config.origin) }, noindex,
    robots: noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  };
}

export function pageGraph(seo: PageSeo, metadata: ReturnType<typeof buildMetadata>, origin: string) {
  if (!metadata.canonical) return null;
  const home = canonicalUrl('/', origin);
  const organization = `${home}#organization`;
  const website = `${home}#website`;
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization', '@id': organization,
      name: siteIdentity.name, legalName: siteIdentity.legalName,
      url: home, description: siteIdentity.description,
      logo: { '@type': 'ImageObject', url: canonicalUrl(siteIdentity.logo.path, origin), width: siteIdentity.logo.width, height: siteIdentity.logo.height },
      sameAs: siteIdentity.sameAs,
    },
    {
      '@type': 'WebSite', '@id': website,
      name: siteIdentity.name, alternateName: siteIdentity.legalName,
      url: home, inLanguage: siteIdentity.language, publisher: { '@id': organization },
    },
    {
      '@type': seo.pageType ?? 'WebPage', '@id': `${metadata.canonical}#webpage`,
      url: metadata.canonical, name: metadata.title, description: metadata.description,
      inLanguage: siteIdentity.language, isPartOf: { '@id': website }, about: { '@id': organization },
      primaryImageOfPage: { '@type': 'ImageObject', url: metadata.image.url, width: metadata.image.width, height: metadata.image.height },
      ...(seo.breadcrumbs?.length ? { breadcrumb: { '@id': `${metadata.canonical}#breadcrumbs` } } : {}),
    },
  ];
  if (seo.breadcrumbs?.length) {
    if (seo.breadcrumbs.length < 2) throw new Error('A breadcrumb trail needs at least two visible items.');
    graph.push({
      '@type': 'BreadcrumbList', '@id': `${metadata.canonical}#breadcrumbs`,
      itemListElement: seo.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem', position: index + 1, name: item.name, item: canonicalUrl(item.path, origin),
      })),
    });
  }
  graph.push(...(seo.structuredData ?? []));
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Filter-result URLs are excluded deliberately; attribution parameters use the clean canonical. */
export function isJobFilterUrl(params: URLSearchParams): boolean {
  return ['q', 'type', 'mode', 'location', 'page'].some((key) => params.has(key) && params.get(key) !== '');
}

export function isUtilityRoute(path: string): boolean {
  return path.startsWith('/api/') || path.startsWith('/jobs/apply/') || path.startsWith('/jobs/share/');
}
