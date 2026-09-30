import type { APIRoute } from "astro";
import { getJobs, publicSiteUrl } from "../../lib/jobboard/api";
import { isActive, jobPath } from "../../lib/jobboard/public-utils";

export const prerender = false;
function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
export const GET: APIRoute = async ({ request }) => {
  try {
    const origin = publicSiteUrl(new URL(request.url).origin);
    const jobs = await getJobs();
    const entries = jobs.filter((job) => isActive(job)).map((job) =>
      `<url><loc>${xml(new URL(jobPath(job), origin).toString())}</loc><lastmod>${xml(job.publishedAt)}</lastmod></url>`,
    ).join("");
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, {
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-store" },
    });
  } catch {
    return new Response("The job sitemap is temporarily unavailable.", {
      status: 503, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }
};
