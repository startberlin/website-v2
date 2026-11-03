import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { securityHeaders } from '../src/lib/security/headers.mjs';

/**
 * Retain the official adapters and cover responses outside Astro middleware.
 * @param {import('astro').AstroIntegration} adapter
 * @param {'node' | 'vercel'} target
 * @returns {import('astro').AstroIntegration}
 */
export function withSecurityHeaders(adapter, target) {
  let root;
  return {
    ...adapter,
    hooks: {
      ...adapter.hooks,
      'astro:config:done': async (context) => {
        root = context.config.root;
        await adapter.hooks['astro:config:done']?.({
          ...context,
          setAdapter: (configuration) => context.setAdapter(target === 'node' ? {
            ...configuration,
            serverEntrypoint: fileURLToPath(new URL('../src/server/node-entry.mjs', import.meta.url)),
          } : configuration),
        });
      },
      'astro:build:done': async (context) => {
        await adapter.hooks['astro:build:done']?.(context);
        if (target !== 'vercel') return;
        const path = new URL('.vercel/output/config.json', root);
        const configuration = JSON.parse(await readFile(path, 'utf8'));
        // Must run before filesystem, redirects and the final 404, including path aliases.
        configuration.routes.unshift({ src: '/.*', headers: securityHeaders, continue: true });
        await writeFile(path, `${JSON.stringify(configuration, null, 2)}\n`);
      },
    },
  };
}
