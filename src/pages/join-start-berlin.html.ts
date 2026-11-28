import type { APIRoute } from 'astro';

export const prerender = false;
export const ALL: APIRoute = ({ url, redirect }) => redirect(`/join${url.search}`, 301);
