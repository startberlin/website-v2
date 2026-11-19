import type { APIRoute } from 'astro';

export const prerender = false;
export const GET: APIRoute = ({ url, redirect }) => {
  const target = `/member-journey${url.search}`;
  return redirect(target, 301);
};
