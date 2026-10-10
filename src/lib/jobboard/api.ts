import { env } from "node:process";
import { validateSiteOrigin } from "../seo/site.mjs";
import type { z } from "zod";
import {
	jobListResponseSchema,
	jobDetailResponseSchema,
	submissionResponseSchema,
	metricsResponseSchema,
	type SubmissionInput,
	type MetricEvent,
	type PublicJob,
} from "./contracts";

export class CockpitError extends Error {
	constructor(
		public readonly code:
			| "unavailable"
			| "not_found"
			| "invalid_response"
			| "conflict"
			| "rate_limited"
			| "invalid_request"
			| "too_large",
		public readonly retryAfter = 60,
	) {
		super(code);
	}
}
/** Runtime-only canonical origin. Private keys are never read by a client island. */
export function publicSiteUrl(requestOrigin?: string): string {
  const raw = env.PUBLIC_SITE_URL;
  if (!raw && env.NODE_ENV === "production")
    throw new Error("PUBLIC_SITE_URL must be configured.");
  return validateSiteOrigin(raw || requestOrigin || "http://localhost:4321");
}

function apiConfig(scope: "read" | "submit" | "metrics") {
	const raw = env.COCKPIT_API_URL;
	const key = env[`JOBBOARD_${scope.toUpperCase()}_API_KEY`];
	if (!raw || !key || key.length < 32) throw new CockpitError("unavailable");
	let url: URL;
	try { url = new URL(raw); } catch { throw new CockpitError("unavailable"); }
	if (
		url.username ||
		url.password ||
		!["https:", "http:"].includes(url.protocol)
	)
		throw new CockpitError("unavailable");
	if (
		url.protocol === "http:" &&
		!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
	)
		throw new CockpitError("unavailable");
	if (url.search || url.hash) throw new CockpitError("unavailable");
	// Also accept the Cockpit origin, avoiding accidental double-prefixing.
	const base = url.pathname.replace(/\/$/, "").endsWith("/api/jobboard/v1")
		? raw.replace(/\/$/, "")
		: `${raw.replace(/\/$/, "")}/api/jobboard/v1`;
	return { base, key };
}

async function apiRequest<T>(
	scope: "read" | "submit" | "metrics",
	path: string,
	schema: z.ZodType<T>,
	body?: unknown,
): Promise<T> {
	const { base, key } = apiConfig(scope);
	let response: Response;
	try {
		response = await fetch(`${base}${path}`, {
			method: body === undefined ? "GET" : "POST",
			cache: "no-store",
			redirect: "error",
			headers: {
				authorization: `Bearer ${key}`,
				accept: "application/json",
				...(body === undefined ? {} : { "content-type": "application/json" }),
			},
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
			signal: AbortSignal.timeout(scope === "metrics" ? 2000 : 8000),
		});
	} catch {
		throw new CockpitError("unavailable");
	}
	if (response.status === 404) throw new CockpitError("not_found");
	if (response.status === 409) throw new CockpitError("conflict");
	if (response.status === 429) {
		const value = Number(response.headers.get("retry-after"));
		throw new CockpitError(
			"rate_limited",
			Number.isFinite(value) && value > 0
				? Math.min(3600, Math.ceil(value))
				: 60,
		);
	}
	if (response.status === 413) throw new CockpitError("too_large");
	if (response.status === 400 || response.status === 422)
		throw new CockpitError("invalid_request");
	if (!response.ok) throw new CockpitError("unavailable");
	try {
		return schema.parse(await response.json());
	} catch {
		throw new CockpitError("invalid_response");
	}
}

export async function getJob(id: string): Promise<PublicJob> {
	if (!id || id.length > 80) throw new CockpitError("not_found");
	return (
		await apiRequest(
			"read",
			`/jobs/${encodeURIComponent(id)}`,
			jobDetailResponseSchema,
		)
	).job;
}

export async function getJobs(): Promise<PublicJob[]> {
	const jobs = new Map<string, PublicJob>();
	const cursors = new Set<string>();
	let cursor: string | null = null;
	for (let page = 0; page < 20; page++) {
		const query = new URLSearchParams({ limit: "100" });
		if (cursor) query.set("cursor", cursor);
		const result = await apiRequest(
			"read",
			`/jobs?${query}`,
			jobListResponseSchema,
		);
		if (result.jobs.length > 100) throw new CockpitError("invalid_response");
		for (const job of result.jobs) jobs.set(job.id, job);
		if (!result.nextCursor) return [...jobs.values()];
		if (cursors.has(result.nextCursor))
			throw new CockpitError("invalid_response");
		cursors.add(result.nextCursor);
		cursor = result.nextCursor;
	}
	// Fail visibly rather than silently present an incomplete filtered result set.
	throw new CockpitError("unavailable");
}

export function submitJob(input: SubmissionInput) {
	return apiRequest("submit", "/submissions", submissionResponseSchema, input);
}
export async function sendMetric(event: MetricEvent): Promise<void> {
	await apiRequest("metrics", "/metrics", metricsResponseSchema, {
		events: [event],
	});
}
