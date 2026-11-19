import type { APIRoute } from 'astro';

export const prerender = false;
export const ALL: APIRoute = ({ url, redirect }) => redirect(`/member-journey${url.search}`, 301);
