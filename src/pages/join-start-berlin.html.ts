import type { APIRoute } from 'astro';

export const prerender = false;
export const GET: APIRoute = ({ url, redirect }) => {
  const target = `/join${url.search}`;
  return redirect(target, 301);
};
