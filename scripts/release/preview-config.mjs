import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
config.headers = [...(config.headers || []), { source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
mkdirSync('.astro', { recursive: true });
writeFileSync('.astro/vercel-preview.json', `${JSON.stringify(config, null, 2)}\n`);
