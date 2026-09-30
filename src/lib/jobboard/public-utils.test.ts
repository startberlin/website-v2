import assert from "node:assert/strict";
import test from "node:test";
import { exampleJob } from "./test-fixtures";
import {
	isActive,
	isDocumentRequest,
	jobHref,
	jobPosting,
	retryMetric,
	safeJsonLd,
	salaryLabel,
	shareTarget,
	sourceFrom,
	sourceHref,
	widgetAncestors,
} from "./public-utils";
import {
	isSafePublicUrl,
	metricEventSchema,
	publicJobSchema,
	submissionInputSchema,
} from "./contracts";

const browserHeaders = () =>
	new Headers({
		accept: "text/html,application/xhtml+xml",
		"user-agent": "Mozilla/5.0 Safari/605.1.15",
		"sec-fetch-dest": "document",
	});
test("widget framing defaults to START and only accepts exact origin overrides", () => {
	assert.equal(
		widgetAncestors(),
		"https://www.start-berlin.com https://start-berlin.com",
	);
	assert.equal(
		widgetAncestors("http://localhost:3013"),
		"http://localhost:3013",
	);
	assert.equal(
		widgetAncestors("https://one.example.com,https://two.example.com"),
		"https://one.example.com https://two.example.com",
	);
	for (const value of [
		"*",
		"https://example.com/path",
		"https://user:pass@example.com",
		"http://example.com",
		"https://example.com; script-src *",
		"https://example.com?foo=bar",
	])
		assert.throws(() => widgetAncestors(value));
});
test("full browser documents count, API and RSC traffic do not", () => {
	assert.equal(isDocumentRequest("GET", browserHeaders()), true);
	for (const method of ["HEAD", "POST", "OPTIONS"])
		assert.equal(isDocumentRequest(method, browserHeaders()), false);
	assert.equal(
		isDocumentRequest("GET", new Headers({ accept: "application/json" })),
		false,
	);
	const headers = browserHeaders();
	headers.set("rsc", "1");
	assert.equal(isDocumentRequest("GET", headers), false);
});
test("prefetch and recognised link previews never count as document events", () => {
	for (const [name, value] of [
		["next-router-prefetch", "1"],
		["next-router-segment-prefetch", "/"],
		["purpose", "prefetch"],
		["sec-purpose", "prefetch;prerender"],
		["user-agent", "WhatsApp/2.24"],
		["user-agent", "facebookexternalhit/1.1"],
		["user-agent", "Googlebot"],
		["user-agent", "LinkedInBot"],
		["sec-fetch-dest", "empty"],
	]) {
		const headers = browserHeaders();
		headers.set(name!, value!);
		assert.equal(isDocumentRequest("GET", headers), false, `${name}: ${value}`);
	}
	const iframe = browserHeaders();
	iframe.set("sec-fetch-dest", "iframe");
	assert.equal(isDocumentRequest("GET", iframe), true);
});
test("sources never retain unknown free text or identities", () => {
	assert.equal(sourceFrom("newsletter"), "newsletter");
	assert.equal(sourceFrom(undefined), "direct");
	assert.equal(sourceFrom(null, "widget"), "widget");
	for (const input of [
		"person@example.com",
		"https://private.example.com/cv?token=abc",
		["newsletter"],
		"NEWSLETTER",
	])
		assert.equal(sourceFrom(input), "unknown");
});
test("attribution links retain the native jobs namespace", () => {
	assert.equal(sourceHref("/apply/job-example", "newsletter"), "/jobs/apply/job-example?source=newsletter");
	assert.equal(sourceHref("/jobs/share/job-example/linkedin", "direct"), "/jobs/share/job-example/linkedin");
	assert.equal(sourceHref("/", "website"), "/jobs?source=website");
});
test("approval URLs reject credentials, private addresses and executable schemes", () => {
	for (const input of [
		"javascript:alert(1)",
		"data:text/html,x",
		"https://admin:password@example.com",
		"http://localhost:3000",
		"http://127.0.0.1",
		"http://2130706433",
		"http://0x7f000001",
		"http://[::1]",
		"http://jobs.internal",
		"https://company.local",
		"https://example.com/\nfoo",
	])
		assert.equal(isSafePublicUrl(input), false, input);
	assert.equal(isSafePublicUrl("https://careers.example.com/job?id=123"), true);
});
test("expiration is enforced even before the backend sweeper runs", () => {
	const job = exampleJob();
	assert.equal(isActive(job), true);
	assert.equal(isActive({ ...job, status: "closed" }), false);
	assert.equal(
		isActive({ ...job, expiresAt: "2020-01-01T00:00:00.000Z" }),
		false,
	);
	assert.equal(isActive(job, Date.parse(job.expiresAt)), false);
});
test("sharing only opens allowed providers with the canonical public role URL", () => {
	const job = exampleJob();
	job.content.title = "Design & Research / Berlin";
	const whatsapp = new URL(
		shareTarget(job, "whatsapp", "https://jobs.example.com")!,
	);
	assert.equal(whatsapp.origin, "https://wa.me");
	assert.match(
		whatsapp.searchParams.get("text")!,
		/Design & Research \/ Berlin at Example Studio/,
	);
	assert.match(
		whatsapp.searchParams.get("text")!,
		/https:\/\/jobs\.example\.com\/jobs\/job-example\/product-intern\?source=whatsapp/,
	);
	const linkedin = new URL(
		shareTarget(job, "linkedin", "https://jobs.example.com")!,
	);
	assert.equal(linkedin.origin, "https://www.linkedin.com");
	assert.equal(
		linkedin.searchParams.get("url"),
		"https://jobs.example.com/jobs/job-example/product-intern?source=linkedin",
	);
	assert.equal(
		shareTarget(job, "https://evil.example.com", "https://jobs.example.com"),
		null,
	);
	assert.equal(jobHref(job), "/jobs/job-example/product-intern");
});
test("closed jobs have no JobPosting and remote eligibility is truthful", () => {
	const job = exampleJob();
	assert.equal(
		jobPosting({ ...job, status: "closed" }, "https://jobs.example.com"),
		null,
	);
	const remote = jobPosting(
		{
			...job,
			content: {
				...job.content,
				remoteMode: "remote",
				countryCodes: ["DE", "AT"],
			},
		},
		"https://jobs.example.com",
	)!;
	assert.equal(remote.jobLocationType, "TELECOMMUTE");
	assert.deepEqual(remote.applicantLocationRequirements, [
		{ "@type": "Country", name: "DE" },
		{ "@type": "Country", name: "AT" },
	]);
	assert.equal("directApply" in remote, false);
	assert.equal(
		jobPosting(
			{
				...job,
				content: {
					...job.content,
					countryCodes: ["DE", "AT"],
					locations: ["Berlin", "Vienna"],
				},
			},
			"https://jobs.example.com",
		),
		null,
	);
});
test("JSON-LD escapes script-closing markup and preserves literal descriptions", () => {
	const job = exampleJob();
	job.content.description =
		"Research this role carefully. </script><script>alert('x')</script> & learn more.";
	const structured = jobPosting(job, "https://jobs.example.com")!;
	assert.match(String(structured.description), /&lt;\/script&gt;/);
	assert.doesNotMatch(safeJsonLd(structured), /<|>|&/);
	assert.equal(
		JSON.parse(safeJsonLd({ text: "</script>\u2028" })).text,
		"</script>\u2028",
	);
});
test("compensation distinguishes undisclosed and unpaid rather than displaying zero", () => {
	const job = exampleJob();
	assert.equal(
		salaryLabel({
			...job.content,
			salaryStatus: "not_disclosed",
			salaryMin: null,
			salaryMax: null,
		}),
		"Salary not disclosed",
	);
	assert.equal(
		salaryLabel({
			...job.content,
			salaryStatus: "unpaid",
			salaryMin: null,
			salaryMax: null,
		}),
		"Unpaid role",
	);
	assert.match(salaryLabel(job.content), /1,500.*1,800.*month/);
	assert.match(
		salaryLabel({ ...job.content, salaryCurrency: "PLN" }),
		/PLN.*1,500.*1,800.*month/,
	);
});
test("metric retries use one immutable identity and remain bounded", async () => {
	const event = metricEventSchema.parse({
		eventId: "be286081-d3db-43f7-81b4-e46842d4f9a8",
		occurredAt: "2026-09-14T12:00:00.000Z",
		type: "detail_request",
		jobId: "example",
		source: "direct",
		surface: "standalone",
	});
	const received: string[] = [];
	assert.equal(
		await retryMetric(event, async (value) => {
			received.push(value.eventId);
			if (received.length === 1) throw new Error("connection lost");
		}),
		true,
	);
	assert.deepEqual(received, [event.eventId, event.eventId]);
	let failures = 0;
	assert.equal(
		await retryMetric(event, async () => {
			failures++;
			throw new Error("offline");
		}),
		false,
	);
	assert.equal(failures, 2);
});
test("wire schemas reject private or forged analytics properties", () => {
	const event = {
		eventId: "be286081-d3db-43f7-81b4-e46842d4f9a8",
		occurredAt: "2026-09-14T12:00:00.000Z",
		type: "detail_request",
		jobId: "example",
		source: "direct",
		surface: "standalone",
	};
	assert.equal(
		metricEventSchema.safeParse({ ...event, email: "private@example.com" })
			.success,
		false,
	);
	assert.equal(
		metricEventSchema.safeParse({ ...event, type: "application_completed" })
			.success,
		false,
	);
	assert.equal(
		metricEventSchema.safeParse({ ...event, jobId: null }).success,
		false,
	);
	assert.equal(
		publicJobSchema.safeParse({
			...exampleJob(),
			contact: { email: "private@example.com" },
		}).success,
		false,
	);
});
test("submissions require authorised publishing and reject hidden administration data", () => {
	const job = exampleJob();
	const input = {
		requestId: "be286081-d3db-43f7-81b4-e46842d4f9a8",
		company: {
			name: job.company.name,
			website: job.company.website,
			description: job.company.description,
		},
		contact: { name: "Test Person", email: "test@example.com" },
		job: job.content,
		permissionToPublish: true,
	};
	assert.equal(submissionInputSchema.safeParse(input).success, true);
	assert.equal(
		submissionInputSchema.safeParse({ ...input, permissionToPublish: false })
			.success,
		false,
	);
	assert.equal(
		submissionInputSchema.safeParse({ ...input, published: true }).success,
		false,
	);
	assert.equal(
		submissionInputSchema.safeParse({
			...input,
			company: { ...input.company, notes: "internal" },
		}).success,
		false,
	);
	assert.equal(
		submissionInputSchema.safeParse({
			...input,
			job: { ...job.content, salaryMax: 100 },
		}).success,
		false,
	);
});
