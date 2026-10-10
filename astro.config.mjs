// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  session: false,
  adapter: process.env.ASTRO_ADAPTER === 'vercel'
    ? vercel()
    : node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    define: {
      __RELEASE_COMMIT__: JSON.stringify(process.env.RELEASE_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null),
      __RELEASE_TREE__: JSON.stringify(process.env.RELEASE_TREE_SHA || null),
    },
  },
});
