import assert from "node:assert/strict";
import test from "node:test";
import {
	assertSameOrigin,
	createSubmissionRateLimiter,
	readBoundedJson,
	submissionRateKey,
} from "./submission-security";
import { createSubmissionAttempt } from "./submission-attempt";

test("form requests require the configured origin and JSON", () => {
	const make = (
		origin: string,
		contentType = "application/json",
		site = "same-origin",
	) =>
		new Request("https://jobs.example.com/api/jobboard/submissions", {
			method: "POST",
			headers: { origin, "content-type": contentType, "sec-fetch-site": site },
			body: "{}",
		});
	assert.doesNotThrow(() =>
		assertSameOrigin(
			make("https://jobs.example.com"),
			"https://jobs.example.com",
		),
	);
	assert.throws(() =>
		assertSameOrigin(
			make("https://evil.example.com"),
			"https://jobs.example.com",
		),
	);
	assert.throws(() =>
		assertSameOrigin(
			make("https://jobs.example.com", "text/plain"),
			"https://jobs.example.com",
		),
	);
	assert.throws(() =>
		assertSameOrigin(
			make("https://jobs.example.com", "application/json", "cross-site"),
			"https://jobs.example.com",
		),
	);
});
test("body reader rejects oversized streams without trusting content length", async () => {
	const bytes = new TextEncoder().encode(
		JSON.stringify({ content: "x".repeat(200) }),
	);
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(bytes.slice(0, 80));
			controller.enqueue(bytes.slice(80));
			controller.close();
		},
	});
	const request = new Request("https://jobs.example.com/api/jobboard/submissions", {
		method: "POST",
		body: stream,
		duplex: "half",
	} as RequestInit);
	await assert.rejects(() => readBoundedJson(request, 100), /too long/);
	const valid = new Request("https://jobs.example.com/api/jobboard/submissions", {
		method: "POST",
		body: '{"ok":true}',
	});
	assert.deepEqual(await readBoundedJson(valid, 100), { ok: true });
	const invalid = new Request("https://jobs.example.com/api/jobboard/submissions", {
		method: "POST",
		body: "not JSON",
	});
	await assert.rejects(() => readBoundedJson(invalid), /could not be read/);
});
test("rate limits expire and keys cannot be evicted by repeated abusive use", () => {
	const limit = createSubmissionRateLimiter(2, 1000);
	assert.equal(limit("a", 100), true);
	assert.equal(limit("a", 200), true);
	assert.equal(limit("a", 300), false);
	assert.equal(limit("a", 900), false);
	assert.equal(limit("b", 901), true);
	assert.equal(limit("a", 1101), true);
});
test("untrusted forwarded headers do not create distinct local rate buckets", () => {
	const first = new Headers({ "x-forwarded-for": "1.2.3.4" });
	const second = new Headers({ "x-forwarded-for": "4.3.2.1" });
	assert.equal(submissionRateKey(first), submissionRateKey(second));
	assert.doesNotMatch(submissionRateKey(first), /1\.2\.3\.4/);
});
test("verified runtime peer addresses distinguish rate buckets without trusting headers", () => {
	const headers = new Headers({ "x-forwarded-for": "1.2.3.4" });
	assert.notEqual(submissionRateKey(headers, "192.0.2.1"), submissionRateKey(headers, "192.0.2.2"));
	assert.equal(submissionRateKey(headers, "invalid"), submissionRateKey(headers));
	assert.doesNotMatch(submissionRateKey(headers, "192.0.2.1"), /192\.0\.2\.1/);
});
test("identical submission retries keep a request key while edited forms get a new one", () => {
	let generated = 0;
	const key = createSubmissionAttempt(() => `id-${++generated}`);
	assert.equal(key({ title: "Product Intern" }), "id-1");
	assert.equal(key({ title: "Product Intern" }), "id-1");
	assert.equal(key({ title: "Product Designer" }), "id-2");
	assert.equal(key({ title: "Product Designer" }), "id-2");
	const separateForm = createSubmissionAttempt(() => `id-${++generated}`);
	assert.equal(separateForm({ title: "Product Intern" }), "id-3");
});
