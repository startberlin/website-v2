import type { APIRoute } from "astro";
import { getJob, CockpitError, publicSiteUrl } from "../../../../lib/jobboard/api";
import { shareTarget } from "../../../../lib/jobboard/public-utils";

export const prerender = false;
const responseHeaders = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "content-type": "text/plain; charset=utf-8" };
export const GET: APIRoute = async ({ request, params }) => {
  const channel = params.channel || "";
  if (channel !== "whatsapp" && channel !== "linkedin")
    return new Response("Unknown sharing channel.", { status: 404, headers: responseHeaders });
  try {
    const job = await getJob(params.id || "");
    const target = shareTarget(job, channel, publicSiteUrl(new URL(request.url).origin));
    if (!target) return new Response("Unknown sharing channel.", { status: 404, headers: responseHeaders });
    return new Response(null, {
      status: 303,
      headers: { location: target, "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" },
    });
  } catch (error) {
    const missing = error instanceof CockpitError && error.code === "not_found";
    return new Response(
      missing ? "This role could not be found." : "Sharing is temporarily unavailable. You can still copy the listing URL.",
      { status: missing ? 404 : 503, headers: responseHeaders },
    );
  }
};
