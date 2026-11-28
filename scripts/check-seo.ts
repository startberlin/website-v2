import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import sharp from 'sharp';
import { pageDefinitions } from '../src/lib/seo/pages';
import { validatePageInventory } from '../src/lib/seo/contract';
import { siteIdentity } from '../src/lib/seo/site.mjs';
import type { PageSeo } from '../src/lib/seo/metadata';

const root = fileURLToPath(new URL('../', import.meta.url));
async function files(directory: string, extensions = ['.astro']): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file, extensions) : Promise.resolve(extensions.some((extension) => file.endsWith(extension)) ? [file] : []);
  }));
  return groups.flat();
}

export async function checkSeo() {
  const pageFiles = await files(path.join(root, 'src/pages'));
  const routes = pageFiles.map((file) => {
    const relative = path.relative(path.join(root, 'src/pages'), file).replaceAll(path.sep, '/').replace(/\.astro$/, '');
    return `/${relative}`.replace(/\/index$/, '') || '/';
  });
  const problems = validatePageInventory(pageDefinitions, routes);
  const unsupported = await files(path.join(root, 'src/pages'), ['.md', '.mdx', '.html']);
  for (const file of unsupported) problems.push(`${path.relative(root, file)}: extend the shared SEO layout and inventory guard before adding another HTML page format.`);
  for (let index = 0; index < pageFiles.length; index++) {
    const source = await readFile(pageFiles[index], 'utf8');
    const route = routes[index];
    const calls = [...source.matchAll(/pageSeo\(\s*['"]([^'"]+)['"]\s*\)/g)];
    if (!calls.some((match) => match[1] === route)) problems.push(`${route}: use pageSeo('${route}') from the page registry.`);
    if (!/<(?:Layout|LegalLayout|JobboardLayout)\b[^>]*\bseo\s*=/.test(source)) problems.push(`${route}: pass seo to a shared layout.`);
  }
  const shellFiles = [...pageFiles, ...await files(path.join(root, 'src/layouts'))];
  const reserved = /<title\b|<meta\b[^>]*(?:name|property)\s*=\s*['"](?:description|robots|googlebot|og:[^'"]+|twitter:[^'"]+)['"]|<link\b[^>]*rel\s*=\s*['"]canonical['"]|<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"]/i;
  for (const file of shellFiles) {
    const source = await readFile(file, 'utf8');
    if (reserved.test(source)) problems.push(`${path.relative(root, file)}: SEOHead owns search/social metadata and JSON-LD.`);
  }
  const definitions: Record<string, PageSeo> = pageDefinitions;
  const images = [siteIdentity.socialImage, siteIdentity.logo, ...Object.values(definitions).flatMap((page) => page.image ? [page.image] : [])];
  for (const image of images) {
    try {
      const file = path.join(root, 'public', image.path);
      await access(file);
      const actual = await sharp(file).metadata();
      if (actual.width !== image.width || actual.height !== image.height) problems.push(`${image.path}: declared SEO dimensions must match the image file.`);
    }
    catch { problems.push(`${image.path}: SEO image must exist in public/ and be readable.`); }
  }
  if (problems.length) throw new Error(`SEO check failed:\n${problems.join('\n')}`);
  console.log(`SEO check passed: ${routes.length} HTML routes share the metadata contract.`);
}

const integration: AstroIntegration = { name: 'start-seo-contract', hooks: { 'astro:build:start': checkSeo } };
export default integration;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkSeo();
}
