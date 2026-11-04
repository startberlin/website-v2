import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { siteIdentity } from '../src/lib/seo/site.mjs';

const root = new URL('../', import.meta.url);
const tokens = await readFile(new URL('src/styles/tokens.css', root), 'utf8');
const navy = tokens.match(/--color-dark-blue:\s*(#[\da-f]+)/i)?.[1];
if (!navy) throw new Error('The shared navy token is required for the public logo background.');
await mkdir(new URL('public/social/', root), { recursive: true });
await sharp(fileURLToPath(new URL('src/assets/hero/hero-3.jpg', root)))
  .resize(siteIdentity.socialImage.width, siteIdentity.socialImage.height, { fit: 'cover' })
  .jpeg({ quality: 85, mozjpeg: true }).toFile(fileURLToPath(new URL(`public${siteIdentity.socialImage.path}`, root)));
await sharp(fileURLToPath(new URL('src/assets/logo.png', root)))
  .flatten({ background: navy }).png().toFile(fileURLToPath(new URL(`public${siteIdentity.logo.path}`, root)));
console.log('Generated public search/social assets from the existing community photo and header logo.');
