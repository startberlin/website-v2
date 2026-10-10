import type { APIRoute } from 'astro';

export const prerender = false;

// Build identity only. Backend acceptance is checked separately by the release workflow.
export const GET: APIRoute = () => Response.json(
  { ok: true, commit: __RELEASE_COMMIT__, tree: __RELEASE_TREE__ },
  { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } },
);
