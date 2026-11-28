import type { APIRoute } from "astro";
import { CockpitError, getJobFavicon } from "../../../lib/jobboard/api";

export const prerender = false;

export const GET: APIRoute = async ({params}) => {
  try {
    return await getJobFavicon(params.id ?? "");
  } catch (error) {
    return new Response(null, {
      status: error instanceof CockpitError && error.code === "not_found" ? 404 : 503,
      headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
    });
  }
};
