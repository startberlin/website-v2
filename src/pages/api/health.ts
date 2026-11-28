import { jobboardMetricsState } from '../../lib/jobboard/api';
import { newsletterConfig } from '../../lib/newsletter/config.mjs';
import type { APIRoute } from 'astro';

export const prerender = false;

// Build identity and actual runtime. Backend acceptance is checked separately.
export const GET: APIRoute = () => Response.json(
  {
    ok: true,
    commit: __RELEASE_COMMIT__,
    tree: __RELEASE_TREE__,
    jobboardMetrics: jobboardMetricsState(),
    newsletterSignup: newsletterConfig() ? 'configured' : 'disabled',
    nodeMajor: Number(process.versions.node.split('.')[0]),
    deploymentCredentialsExposed: Boolean(process.env.VERCEL_TOKEN || process.env.VERCEL_AUTOMATION_BYPASS_SECRET),
  },
  { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } },
);
