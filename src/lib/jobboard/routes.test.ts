import assert from "node:assert/strict";
import test from "node:test";
import { GET as apply } from "../../pages/jobs/apply/[id]";
import { GET as share } from "../../pages/jobs/share/[id]/[channel]";
import { GET as sitemap } from "../../pages/jobs/sitemap.xml";
import { POST as submit } from "../../pages/api/jobboard/submissions";
import { exampleJob } from "./test-fixtures";

const envKeys = ["COCKPIT_API_URL", "JOBBOARD_READ_API_KEY", "JOBBOARD_SUBMIT_API_KEY", "PUBLIC_SITE_URL", "SITE_INDEXABLE"] as const;
async function configured(run: () => Promise<void>) {
  const before = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const fetchBefore = globalThis.fetch;
  process.env.COCKPIT_API_URL = "https://cockpit.example.com";
  process.env.JOBBOARD_READ_API_KEY = "test-read-key-that-is-at-least-32-characters";
  process.env.JOBBOARD_SUBMIT_API_KEY = "test-submit-key-that-is-at-least-32-characters";
  process.env.PUBLIC_SITE_URL = "https://www.start-berlin.com";
  process.env.SITE_INDEXABLE = "true";
  try { await run(); } finally {
    globalThis.fetch = fetchBefore;
    for (const key of envKeys) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
}
function context(url: string, params: Record<string, string> = {}) {
  return { request: new Request(url), params } as never;
}
function reply(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}
function input() {
  const job = exampleJob();
  return {
    requestId: "be286081-d3db-43f7-81b4-e46842d4f9a8",
    company: { name: job.company.name, website: job.company.website, description: job.company.description },
    contact: { name: "Test Person", email: "test@example.com" },
    job: job.content, permissionToPublish: true,
  };
}
function submission(body: unknown, clientAddress = "192.0.2.1", headers: Record<string, string> = {}) {
  return {
    clientAddress,
    request: new Request("https://www.start-berlin.com/api/jobboard/submissions", {
      method: "POST",
      headers: { origin: "https://www.start-berlin.com", "content-type": "application/json", "sec-fetch-site": "same-origin", ...headers },
      body: JSON.stringify(body),
    }),
  } as never;
}

test("applications recheck expiry and use only the approved URL", async () => {
  await configured(async () => {
    globalThis.fetch = async () => reply({ version: "1", job: exampleJob() });
    const allowed = await apply(context("https://www.start-berlin.com/jobs/apply/job-example?url=https://evil.example.com", { id: "job-example" }));
    assert.equal(allowed.status, 303);
    assert.equal(allowed.headers.get("location"), exampleJob().content.applyUrl);
    assert.equal(allowed.headers.get("referrer-policy"), "no-referrer");
    globalThis.fetch = async () => reply({ version: "1", job: { ...exampleJob(), expiresAt: "2020-01-01T00:00:00.000Z" } });
    const expired = await apply(context("https://www.start-berlin.com/jobs/apply/job-example", { id: "job-example" }));
    assert.equal(expired.status, 303);
    assert.equal(expired.headers.get("location"), "https://www.start-berlin.com/jobs/job-example/product-intern");
    globalThis.fetch = async () => reply({ version: "1", job: { ...exampleJob(), content: { ...exampleJob().content, applyUrl: "javascript:alert(1)" } } });
    assert.equal((await apply(context("https://www.start-berlin.com/jobs/apply/job-example", { id: "job-example" }))).status, 503);
  });
});

test("sharing rejects arbitrary channels and builds URLs using the configured website origin", async () => {
  await configured(async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return reply({ version: "1", job: exampleJob() }); };
    assert.equal((await share(context("https://www.start-berlin.com/jobs/share/job-example/evil", { id: "job-example", channel: "evil" }))).status, 404);
    assert.equal(calls, 0);
    const response = await share(context("http://localhost:4321/jobs/share/job-example/linkedin", { id: "job-example", channel: "linkedin" }));
    const target = new URL(response.headers.get("location")!);
    assert.equal(response.status, 303);
    assert.equal(target.origin, "https://www.linkedin.com");
    assert.equal(target.searchParams.get("url"), "https://www.start-berlin.com/jobs/job-example/product-intern?source=linkedin");
  });
});

test("missing application and share records differ from a temporary upstream outage", async () => {
  await configured(async () => {
    globalThis.fetch = async () => reply({}, 404);
    assert.equal((await apply(context("https://www.start-berlin.com/jobs/apply/missing", { id: "missing" }))).status, 404);
    assert.equal((await share(context("https://www.start-berlin.com/jobs/share/missing/whatsapp", { id: "missing", channel: "whatsapp" }))).status, 404);
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal((await apply(context("https://www.start-berlin.com/jobs/apply/missing", { id: "missing" }))).status, 503);
    assert.equal((await share(context("https://www.start-berlin.com/jobs/share/missing/whatsapp", { id: "missing", channel: "whatsapp" }))).status, 503);
  });
});

test("sitemap includes active listings only and fails visibly on upstream errors", async () => {
  await configured(async () => {
    globalThis.fetch = async () => reply({ version: "1", jobs: [exampleJob(), { ...exampleJob(), id: "closed", status: "closed" }, { ...exampleJob(), id: "expired", expiresAt: "2020-01-01T00:00:00.000Z" }], nextCursor: null });
    const response = await sitemap(context("https://www.start-berlin.com/jobs/sitemap.xml"));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/xml; charset=utf-8");
    const xml = await response.text();
    assert.match(xml, /https:\/\/www.start-berlin.com\/jobs\/job-example\/product-intern/);
    assert.doesNotMatch(xml, /\/jobs\/(closed|expired)\//);
    globalThis.fetch = async () => reply({}, 500);
    assert.equal((await sitemap(context("https://www.start-berlin.com/jobs/sitemap.xml"))).status, 503);
  });
});

test("submission preserves request identity and private contact only in scoped upstream payload", async () => {
  await configured(async () => {
    const received: unknown[] = [];
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), "https://cockpit.example.com/api/jobboard/v1/submissions");
      assert.equal(new Headers(init?.headers).get("authorization"), `Bearer ${process.env.JOBBOARD_SUBMIT_API_KEY}`);
      received.push(JSON.parse(String(init?.body)));
      return reply({ version: "1", id: "submission-example", status: "pending_review" });
    };
    const first = await submit(submission(input()));
    const retry = await submit(submission(input()));
    assert.equal(first.status, 202);
    assert.equal(retry.status, 202);
    assert.deepEqual(received[0], received[1]);
    const body = await first.json();
    assert.deepEqual(body, { version: "1", id: "submission-example", status: "pending_review" });
    assert.doesNotMatch(JSON.stringify(body), /test@example.com/);
  });
});

test("submission rejects cross-origin, oversized or administrative payloads and absorbs honeypots", async () => {
  await configured(async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new Error("unexpected upstream request"); };
    assert.equal((await submit(submission(input(), "192.0.2.2", { origin: "https://evil.example.com" }))).status, 403);
    assert.equal((await submit(submission({ text: "x".repeat(41_000) }, "192.0.2.3"))).status, 413);
    assert.equal((await submit(submission({ ...input(), published: true }, "192.0.2.4"))).status, 400);
    assert.equal((await submit(submission({ ...input(), websiteConfirmation: "bot" }, "192.0.2.5"))).status, 202);
    assert.equal(calls, 0);
  });
});

test("submission maps upstream retry and conflict states without creating a new request ID", async () => {
  await configured(async () => {
    globalThis.fetch = async () => reply({}, 429, { "retry-after": "120" });
    const limited = await submit(submission(input(), "192.0.2.6"));
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("retry-after"), "120");
    globalThis.fetch = async () => reply({}, 409);
    assert.equal((await submit(submission(input(), "192.0.2.7"))).status, 409);
    globalThis.fetch = async () => reply({}, 500);
    assert.equal((await submit(submission(input(), "192.0.2.8"))).status, 503);
  });
});
