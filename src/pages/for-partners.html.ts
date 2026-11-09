import type { APIRoute } from 'astro';

// Legacy Webflow URL; the Partners page replaces it.
export const prerender = false;
export const GET: APIRoute = ({ redirect }) => redirect('/partners', 301);
