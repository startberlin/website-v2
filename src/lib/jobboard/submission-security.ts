import { createHash } from "node:crypto";
import { isIP } from "node:net";

export class SubmissionRequestError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
	}
}

export function assertSameOrigin(
	request: Request,
	configuredOrigin: string,
): void {
	if (request.headers.get("origin") !== new URL(configuredOrigin).origin)
		throw new SubmissionRequestError(
			403,
			"This form must be submitted from the jobboard.",
		);
	const site = request.headers.get("sec-fetch-site");
	if (site && site !== "same-origin")
		throw new SubmissionRequestError(
			403,
			"This form must be submitted from the jobboard.",
		);
	if (
		!request.headers
			.get("content-type")
			?.toLowerCase()
			.startsWith("application/json")
	)
		throw new SubmissionRequestError(415, "Use a JSON request.");
}

export async function readBoundedJson(
	request: Request,
	maximum = 40_000,
): Promise<unknown> {
	const length = Number(request.headers.get("content-length"));
	if (Number.isFinite(length) && length > maximum)
		throw new SubmissionRequestError(413, "The listing is too long.");
	if (!request.body)
		throw new SubmissionRequestError(400, "The form is empty.");
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.length;
			if (size > maximum) {
				await reader.cancel();
				throw new SubmissionRequestError(413, "The listing is too long.");
			}
			chunks.push(value);
		}
		const bytes = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.length;
		}
		return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
	} catch (error) {
		if (error instanceof SubmissionRequestError) throw error;
		throw new SubmissionRequestError(400, "The form could not be read.");
	} finally {
		reader.releaseLock();
	}
}

type Bucket = { count: number; expires: number };
export function createSubmissionRateLimiter(
	maximum = 5,
	windowMs = 15 * 60_000,
) {
	const buckets = new Map<string, Bucket>();
	return (key: string, now = Date.now()): boolean => {
		for (const [entry, bucket] of buckets)
			if (bucket.expires <= now) buckets.delete(entry);
		const current = buckets.get(key);
		if (current) {
			current.count += 1;
			return current.count <= maximum;
		}
		if (buckets.size >= 10_000) return false;
		buckets.set(key, { count: 1, expires: now + windowMs });
		return true;
	};
}

export function submissionRateKey(headers: Headers, clientAddress?: string): string {
	// Only trust headers overwritten by the actual deployment proxy. Never arbitrary XFF.
	const vercel =
		process.env.VERCEL === "1" ? headers.get("x-vercel-forwarded-for") : null;
	const candidate = vercel?.split(",")[0]?.trim();
	// Node supplies the socket address through Astro. Do not trust arbitrary forwarded headers.
	// Unknown clients share a conservative bucket when no trusted address is available.
	const ip = clientAddress && isIP(clientAddress)
    ? clientAddress
    : candidate && isIP(candidate) ? candidate : "unknown";
	return createHash("sha256").update(ip).digest("hex");
}
