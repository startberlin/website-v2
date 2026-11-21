import { canonicalUrl, type PageSeo } from './metadata';
import { siteIdentity } from './site.mjs';

/** Used by the build guard and tests; unknown and orphan routes must never silently disappear. */
export function validatePageInventory(definitions: Record<string, PageSeo>, routes: string[]): string[] {
  const problems: string[] = [];
  const known = new Set(routes);
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const route of known) {
    if (!Object.hasOwn(definitions, route)) problems.push(`${route}: add SEO metadata in src/lib/seo/pages.ts.`);
  }
  for (const [route, seo] of Object.entries(definitions)) {
    if (!known.has(route)) problems.push(`${route}: metadata has no implemented HTML route.`);
    const title = seo.title?.trim();
    const description = seo.description?.replace(/\s+/g, ' ').trim();
    if (!title || titles.has(title)) problems.push(`${route}: provide a non-empty, unique title.`);
    if (!description || descriptions.has(description)) problems.push(`${route}: provide a non-empty, unique description.`);
    titles.add(title);
    descriptions.add(description);
    if (title?.includes(`| ${siteIdentity.name}`)) problems.push(`${route}: the shared head adds the brand suffix.`);
    if (seo.canonicalPath === null) {
      if (!seo.noindex) problems.push(`${route}: a missing canonical requires an explicit noindex policy.`);
    } else {
      try {
        const canonical = canonicalUrl(seo.canonicalPath, siteIdentity.defaultOrigin);
        if (canonical !== `${siteIdentity.defaultOrigin}${route}`) problems.push(`${route}: canonical must match the implemented route without parameters or trailing slash.`);
      } catch { problems.push(`${route}: canonical must be a valid site-relative path.`); }
    }
    if (route.includes('[') && (seo.canonicalPath !== null || !seo.noindex)) {
      problems.push(`${route}: dynamic templates need a record-specific canonical and indexing policy at runtime.`);
    }
  }
  return problems;
}
