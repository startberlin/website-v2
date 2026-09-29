import type { APIRoute } from "astro";
import { getJob, CockpitError } from "../../../lib/jobboard/api";
import { isSafePublicUrl } from "../../../lib/jobboard/contracts";
import { isActive, jobPath } from "../../../lib/jobboard/public-utils";

export const prerender = false;
export const GET: APIRoute = async ({ request, params }) => {
  try {
    const job = await getJob(params.id || "");
    if (!isActive(job))
      return new Response(null, {
        status: 303,
        headers: { location: new URL(jobPath(job), request.url).toString(), "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
      });
    if (!isSafePublicUrl(job.content.applyUrl))
      return new Response("The application link is unavailable.", {
        status: 503,
        headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "content-type": "text/plain; charset=utf-8" },
      });
    return new Response(null, {
      status: 303,
      headers: { location: job.content.applyUrl, "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" },
    });
  } catch (error) {
    const missing = error instanceof CockpitError && error.code === "not_found";
    return new Response(
      missing ? "This role could not be found." : "Applications are temporarily unavailable. Return to the listing and try again.",
      { status: missing ? 404 : 503, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "content-type": "text/plain; charset=utf-8" } },
    );
  }
};
