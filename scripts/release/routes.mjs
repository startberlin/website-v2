import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export function pageRoutes(root = fileURLToPath(new URL('../../src/pages/', import.meta.url))) {
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.astro')) files.push(relative(root, path).replaceAll('\\', '/'));
    }
  }
  walk(root);
  return files.filter(file => !file.includes('[') && !file.includes(']') && !/^(?:404|500)\.astro$/.test(file)).map(file => {
    const parts = file.replace(/\.astro$/, '').split('/');
    if (parts.at(-1) === 'index') parts.pop();
    return `/${parts.map(encodeURIComponent).join('/')}`;
  }).sort();
}
