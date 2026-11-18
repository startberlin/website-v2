import { randomUUID } from "node:crypto";
import { waitUntil } from "@vercel/functions";
import { jobboardMetricsState, sendMetric } from "./api";
import type { MetricEvent } from "./contracts";
import { isDocumentRequest, retryMetric, sourceFrom } from "./public-utils";

export type JobNavigation =
  | { type: "board_request" }
  | { type: "detail_request" | "apply_redirect"; jobId: string }
  | { type: "share_redirect"; jobId: string; channel: "whatsapp" | "linkedin" };

export function recordJobNavigation(
  request: Request,
  status: number,
  navigation: JobNavigation,
) {
  const redirect = navigation.type === "apply_redirect" || navigation.type === "share_redirect";
  if (status !== (redirect ? 303 : 200)) return;
  if (
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1" ||
    !isDocumentRequest(request.method, request.headers) ||
    jobboardMetricsState() !== "configured"
  ) return;

  const source = navigation.type === "share_redirect"
    ? navigation.channel
    : sourceFrom(new URL(request.url).searchParams.get("source"));
  const event: MetricEvent = {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    type: navigation.type,
    jobId: navigation.type === "board_request" ? null : navigation.jobId,
    surface: "standalone",
    source,
  };
  const delivery = retryMetric(event, sendMetric).then(delivered => {
    if (!delivered) console.warn("Jobboard request metric delivery failed.");
  });
  // Retain this invocation on Vercel after returning the HTML or redirect.
  waitUntil(delivery);
  return delivery;
}
