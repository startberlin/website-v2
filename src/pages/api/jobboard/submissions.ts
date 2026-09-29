import type { APIRoute } from "astro";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { submissionInputSchema } from "../../../lib/jobboard/contracts";
import { submitJob, CockpitError, publicSiteUrl } from "../../../lib/jobboard/api";
import {
  assertSameOrigin,
  createSubmissionRateLimiter,
  readBoundedJson,
  submissionRateKey,
  SubmissionRequestError,
} from "../../../lib/jobboard/submission-security";

export const prerender = false;
const rateLimit = createSubmissionRateLimiter();
const envelopeSchema = submissionInputSchema.extend({
  websiteConfirmation: z.string().max(200).optional(),
});

function json(value: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", ...headers },
  });
}

export const POST: APIRoute = async (context) => {
  const { request } = context;
  try {
    assertSameOrigin(request, publicSiteUrl(new URL(request.url).origin));
    if (!rateLimit(submissionRateKey(request.headers, context.clientAddress)))
      return json({ error: "Please wait before submitting again." }, 429, { "retry-after": "900" });
    const result = envelopeSchema.safeParse(await readBoundedJson(request));
    if (!result.success) return json({ error: "Check the listing fields." }, 400);
    const { websiteConfirmation, ...input } = result.data;
    if (websiteConfirmation)
      return json({ version: "1", id: randomUUID(), status: "pending_review" }, 202);
    return json(await submitJob(input), 202);
  } catch (error) {
    if (error instanceof SubmissionRequestError)
      return json({ error: error.message }, error.status);
    if (error instanceof CockpitError && error.code === "rate_limited")
      return json({ error: "Please wait before submitting again." }, 429, { "retry-after": String(error.retryAfter) });
    if (error instanceof CockpitError && (error.code === "invalid_request" || error.code === "too_large"))
      return json({ error: "Check the listing details and their length." }, error.code === "too_large" ? 413 : 400);
    if (error instanceof CockpitError && error.code === "conflict")
      return json({ error: "The submission could not be confirmed. Reload the form before starting a new submission." }, 409);
    return json({ error: "Receipt could not be confirmed. Please retry the same form." }, 503);
  }
};

export const ALL: APIRoute = () => json({ error: "Use a POST request." }, 405, { allow: "POST" });
