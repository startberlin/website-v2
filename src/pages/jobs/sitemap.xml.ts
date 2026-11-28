import type { APIRoute } from "astro";
import { getJobs } from "../../lib/jobboard/api";
import { isActive, jobPath } from "../../lib/jobboard/public-utils";
import { getSiteConfig } from "../../lib/seo/metadata";
import { sitemapXml, xmlResponse } from "../../lib/seo/sitemap";

export const prerender = false;
export const GET: APIRoute = async () => {
  try {
    const config = getSiteConfig();
    if (!config.indexable) return xmlResponse(sitemapXml([], config.origin));
    const jobs = await getJobs();
    // The public contract supplies publication time, not the last significant edit.
    return xmlResponse(sitemapXml(jobs.filter((job) => isActive(job)).map(jobPath), config.origin));
  } catch {
    return new Response("The job sitemap is temporarily unavailable.", {
      status: 503, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }
};
