// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { loadEnvFile } from 'node:process';
import { resolveSiteConfig } from './src/lib/seo/site.mjs';
import seoContract from './scripts/check-seo.ts';
import { withSecurityHeaders } from './scripts/security-adapter.mjs';

// Configuration runs before Astro loads .env. Keep build and runtime origins aligned.
try { loadEnvFile(new URL('.env', import.meta.url)); }
catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
}
const siteConfig = resolveSiteConfig(process.env);

// https://astro.build/config
export default defineConfig({
  site: siteConfig.origin,
  trailingSlash: 'never',
  output: 'static',
  session: false,
  adapter: process.env.ASTRO_ADAPTER === 'vercel'
    ? withSecurityHeaders(vercel(), 'vercel')
    : withSecurityHeaders(node({ mode: 'standalone' }), 'node'),
  integrations: [react(), seoContract],
  vite: {
    define: {
      __RELEASE_COMMIT__: JSON.stringify(process.env.RELEASE_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null),
      __RELEASE_TREE__: JSON.stringify(process.env.RELEASE_TREE_SHA || null),
    },
  },
});
