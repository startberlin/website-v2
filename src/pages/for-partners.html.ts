import type { APIRoute } from 'astro';

export const prerender = false;
export const ALL: APIRoute = ({ url, redirect }) => redirect(`/partners${url.search}`, 301);
