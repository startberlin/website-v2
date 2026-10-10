# SEO and AI search

This is the required contract for current and future START Berlin V2 pages. The implementation covers technical SEO and visibility in AI search, commonly called AEO/GEO. Research was checked against primary documentation on 10 October 2026. Actual search visibility still depends on published content and the selected production host.

## Shared implementation

| Owner | Responsibility |
| --- | --- |
| `src/lib/seo/site.mjs` | Public origin validation, indexing policy, brand identity and default search/social assets. |
| `src/lib/seo/pages.ts` | Required page inventory with unique titles/descriptions, canonical paths and page-level exclusions. |
| `src/components/SEOHead.astro` | The single HTML head for search metadata, Open Graph, large social cards and escaped JSON-LD. |
| `src/layouts/Layout.astro` | Required `seo` prop for every page. LegalLayout and JobboardLayout forward the same contract. |
| `src/lib/seo/metadata.ts` | Canonical URL normalization, error policy, record-specific snippets and structured-data graph. |
| `src/middleware.ts` | Runtime `X-Robots-Tag` for previews, excluded pages, utility endpoints and HTTP errors. |
| `/sitemap.xml` | Sitemap index, independent of Cockpit availability. |
| `/sitemap-pages.xml` | Indexable routes from the page inventory. New registered public pages join automatically. |
| `/jobs/sitemap.xml` | Fresh active-role URLs from Cockpit. A backend outage remains HTTP 503. |
| `/robots.txt` | Production crawler access and sitemap discovery, or preview crawl exclusion. |
| `scripts/check-seo.ts` | Rejects missing/orphan pages, copied metadata, duplicate head ownership and incorrect image dimensions. Also runs on every Astro build. |

All current HTML routes use this structure. Home, Join, Members, Jobs and the general legal pages are intended to be indexable in production. Employer submission and Jobs privacy retain their existing noindex policy. Job filter and pagination variants are deliberately excluded; attribution parameters such as `source` use the clean canonical. Active job detail pages remain independently discoverable through their sitemap. Closed/expired details retain their helpful content but have no JobPosting and are noindex. Error pages have no canonical or structured-data graph. Missing routes use the shared 404 page and HTTP 404.

The root sitemap contains two submaps, so a Cockpit failure does not remove the general page inventory. Sitemaps describe the intended public routes; a temporary Jobs 503 is preserved rather than disguised as a successful empty result. No sitemap contains redirects, reserved unbuilt pages, filters or utility endpoints. The public Jobs contract has publication timestamps but no reliable last-significant-edit timestamp, so `lastmod` is omitted. Add it only when that source exists.

## Adding a page

1. Add the actual route and its unique metadata to `pageDefinitions`. The key must match the Astro route without a trailing slash. Use a concise page-specific title; the head adds ` | START Berlin` once. Describe the page's actual content naturally.
2. Use the existing shared layout. Supply `pageSeo()` for that route and keep one descriptive H1. Make the page reachable through a relevant internal link.
3. Review its indexing policy. Errors/private utilities are excluded. A useful public page receives a self-referencing canonical and a sitemap entry. Query parameters and fragments are removed from canonicals.
4. Reuse the default social image or supply `image: { path, width, height, type, alt }` for a real local raster in `public/`. Use descriptive alt text; never place essential information only in an image.
5. Add factual structured data through `structuredData`, using the most relevant supported schema. `breadcrumbs` is optional and requires matching visible breadcrumb links. Add language alternatives only after equivalent published translations exist, and extend the common head together with its checks.
6. Run the checks below and inspect the built route's HTML and status. Confirm metadata, canonical, graph and sitemap agree. Verify mobile rendering and required page interactions through the design guide.

Example after registering `/example`:

```astro
---
import Layout from '../layouts/Layout.astro';
import { pageSeo } from '../lib/seo/pages';
---
<Layout seo={pageSeo('/example')}>
  <section class="page-container">
    <h1>A heading that describes this page</h1>
    <p>Useful page content rendered on the server.</p>
  </section>
</Layout>
```

For dynamic content, register the route template with `canonicalPath: null` and `noindex: true`, then override its title/description, canonical path and indexing policy from the successfully loaded public record. Preserve real 404/503 errors. The existing Jobs detail page demonstrates this flow. Do not put a generic fallback page into the index when a record is missing.

The current page format is Astro. Markdown, MDX and raw HTML page additions fail the guard until their shared-layout and inventory support is deliberately added. They must not bypass the same metadata policy.

## Build and deployment policy

`PUBLIC_SITE_URL` is one exact origin shared by Astro's `site`, metadata, sitemaps and Jobs URLs. The default points to START Berlin's existing public domain. It does not establish a V2 deployment. `trailingSlash: 'never'` aligns internal routes with canonicals. The root URL retains its required `/`.

`SITE_INDEXABLE` defaults to `false`. Previews render `noindex`, expose empty sitemaps and disallow automated crawling. Provider preview contexts on Vercel/Netlify also suppress indexing. This is defense in depth: robots.txt controls crawling, while meta/HTTP directives control indexing. A public page excluded with noindex remains crawlable in production so a crawler can actually read its directive.

The provider checks use [Vercel's VERCEL_ENV](https://vercel.com/docs/environment-variables/system-environment-variables) and [Netlify deploy contexts](https://docs.netlify.com/deploy/deploy-overview/). Configure the explicit indexing flag independently of provider defaults.

Set the same public origin and indexing flag for the approved production build and server runtime. Astro config loads local `.env` when present; provider variables take precedence. Production HTML is prerendered for the general pages. Changing runtime variables does not rewrite that HTML. Build previews separately, and do not reuse indexable production HTML on a public preview hostname without hosting-level noindex headers or access protection. Conversely, rebuild when enabling production indexing. Hosting redirects should consolidate HTTP and alternate hosts onto the configured HTTPS origin.

```sh
pnpm --config.verify-deps-before-run=false run check:seo
pnpm --config.verify-deps-before-run=false run test:seo
ASTRO_TELEMETRY_DISABLED=1 pnpm --config.verify-deps-before-run=false run typecheck
pnpm --config.verify-deps-before-run=false run check:design
pnpm --config.verify-deps-before-run=false run test:jobboard
ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs build --outDir .astro/seo-preview-build
```

For an isolated production-policy verification build, supply `PUBLIC_SITE_URL=https://www.start-berlin.com SITE_INDEXABLE=true` to the last command and choose a separate output directory. This remains a local test. Preserve tracked `dist/`. The Node server must serve the discovery endpoints and live Jobs routes; static HTML alone is insufficient.

The public JPEG is 1200 × 630. The Organization logo uses the actual Header logo on the shared navy background, rather than the older browser icon. Regenerate these assets with `node scripts/generate-social-images.mjs` after changing the source photo/logo or relevant token. Existing originals stay untouched. These metadata assets add no client JavaScript.

## Research and implementation decisions

| Primary guidance | Decision for START Berlin |
| --- | --- |
| [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) | Unique useful titles/descriptions, understandable headings, crawlable links, accessible text and responsive images. Avoid keyword stuffing and meta-keyword tags. Existing image dimensions and eager/high-priority hero delivery are preserved. |
| [Google generative AI optimization](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | Apply the same SEO foundation to AI search. Keep essential content in server HTML and support claims with published facts. Google does not use llms.txt and requires no special AI schema; no speculative AI-only files or hidden content were added. |
| [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a) | Clear discoverable content and structured data support Bing/Copilot visibility. Use the public sitemap and crawlable links. Track citations and visibility after release. |
| [Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) | Use one absolute canonical per successful page. Canonical paths, sitemap entries and internal links agree; remove attribution parameters and fragments. Keep permanent legacy legal redirects. |
| [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | Root discovery, UTF-8 XML and escaped absolute URLs. No made-up lastmod, priority or changefreq. Split further if a submap reaches 50,000 URLs or 50 MB. |
| [Robots meta and HTTP directives](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) | Central noindex policy with HTTP reinforcement for runtime responses. Public content permits large image/snippet previews. No production robots block prevents crawlers from seeing noindex on excluded pages. |
| [Organization data](https://developers.google.com/search/docs/appearance/structured-data/organization) and [site names](https://developers.google.com/search/docs/appearance/site-names) | A connected Organization/WebSite/WebPage graph uses START Berlin's public name, actual logo and existing social profiles. Do not copy unverified headline figures into schema. No fictional SearchAction is declared. |
| [Structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) | JSON-LD describes the page and its visible facts. Optional content types extend the shared graph. Safe serialization preserves CMS text without allowing script-closing markup. No fabricated ratings or hidden FAQ content. |
| [JobPosting guidance](https://developers.google.com/search/docs/appearance/structured-data/job-posting) | Retain the existing active-record schema, factual salary/location mapping and application destination. Remove JobPosting and sitemap inclusion when a role expires/closes. The Jobs listing itself has no JobPosting. |
| [Open Graph protocol](https://ogp.me/) | Page title/description, URL, locale, site name and a real image with dimensions/MIME type/alt text. Large social-card tags use the same page values and JPEG. |
| [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) | Production wildcard access permits OAI-SearchBot. Search access is independent of GPTBot/model training. No new training restriction or special bot group changes the general crawler policy. Host/firewall access still requires release verification. |
| [Core Web Vitals](https://web.dev/articles/vitals) | Preserve the existing small Astro shell and image priorities. Measure LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1 at the 75th percentile in production. Local checks are not field measurements. |
| [Astro configuration/environment variables](https://docs.astro.build/en/guides/environment-variables/), [middleware](https://docs.astro.build/en/guides/middleware/) and [sitemap integration limitations](https://docs.astro.build/en/guides/integrations-guide/sitemap/) | Use a typed shared head and an enforced route inventory. The stock sitemap integration cannot discover dynamic job records; the two endpoint submaps handle static page policy and fresh Cockpit data explicitly without adding a dependency. |

## Release verification still required

Configure the approved V2 host and canonical origin. Enable indexing only after the real content, legal disclosures and external destinations pass the existing release plan. Verify public 200/404/503 responses, host/slash redirects, crawl access and all sitemap targets through that host. Resolve reserved unbuilt navigation destinations before release; they are deliberately absent from sitemaps now.

Use Google Search Console and Bing Webmaster Tools to verify ownership and submit `/sitemap.xml`. Check rendered HTML with URL Inspection and actual public structured data with the Rich Results Test. Monitor indexing, AI/search referrals and field performance after release. Search Console access, search-engine submission and live indexing were not performed by this local implementation. Neither schema nor a sitemap guarantees rankings or AI citations.
