import assert from "node:assert/strict";
import test from "node:test";
import { CockpitError, getJob, getJobs, publicSiteUrl } from "./api";
import { exampleJob } from "./test-fixtures";

const keys = ["COCKPIT_API_URL", "JOBBOARD_READ_API_KEY", "PUBLIC_SITE_URL", "NODE_ENV"] as const;
async function configured(run: () => Promise<void> | void) {
  const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const fetchBefore = globalThis.fetch;
  process.env.COCKPIT_API_URL = "https://cockpit.example.com";
  process.env.JOBBOARD_READ_API_KEY = "test-read-key-that-is-at-least-32-characters";
  process.env.PUBLIC_SITE_URL = "https://www.start-berlin.com";
  try { await run(); } finally {
    globalThis.fetch = fetchBefore;
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
}
function reply(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

test("canonical origins use runtime configuration and require it in production", async () => {
  await configured(() => {
    assert.equal(publicSiteUrl("http://localhost:4321"), "https://www.start-berlin.com");
    for (const value of ["https://example.com/path", "https://user:pass@example.com", "http://example.com", "https://example.com?token=x", "javascript:alert(1)"]) {
      process.env.PUBLIC_SITE_URL = value;
      assert.throws(() => publicSiteUrl());
    }
    delete process.env.PUBLIC_SITE_URL;
    process.env.NODE_ENV = "development";
    assert.equal(publicSiteUrl("http://localhost:4321"), "http://localhost:4321");
    process.env.NODE_ENV = "production";
    assert.throws(() => publicSiteUrl("http://localhost:4321"), /must be configured/);
  });
});

test("server reads use the scoped key, bounded timeout and freshly fetch each request", async () => {
  await configured(async () => {
    let calls = 0;
    globalThis.fetch = async (input, init) => {
      calls++;
      assert.equal(String(input), "https://cockpit.example.com/api/jobboard/v1/jobs/job-example");
      assert.equal(new Headers(init?.headers).get("authorization"), `Bearer ${process.env.JOBBOARD_READ_API_KEY}`);
      assert.equal(init?.cache, "no-store");
      assert.equal(init?.redirect, "error");
      assert.ok(init?.signal instanceof AbortSignal);
      return reply({ version: "1", job: { ...exampleJob(), status: calls === 1 ? "active" : "closed" } });
    };
    assert.equal((await getJob("job-example")).status, "active");
    assert.equal((await getJob("job-example")).status, "closed");
    assert.equal(calls, 2);
  });
});

test("unsafe Cockpit configuration, malformed public payloads and missing IDs fail closed", async () => {
  await configured(async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return reply({ version: "1", job: { ...exampleJob(), contact: { email: "private@example.com" } } });
    };
    for (const value of ["not a URL", "http://cockpit.example.com", "https://user:pass@example.com", "https://cockpit.example.com?key=x"]) {
      process.env.COCKPIT_API_URL = value;
      await assert.rejects(() => getJob("job-example"), (error: unknown) => error instanceof CockpitError && error.code === "unavailable");
    }
    assert.equal(calls, 0);
    process.env.COCKPIT_API_URL = "https://cockpit.example.com/api/jobboard/v1";
    await assert.rejects(() => getJob("job-example"), (error: unknown) => error instanceof CockpitError && error.code === "invalid_response");
    await assert.rejects(() => getJob(""), (error: unknown) => error instanceof CockpitError && error.code === "not_found");
    assert.equal(calls, 1);
  });
});

test("listing pagination deduplicates IDs and rejects repeated cursors or partial overflow", async () => {
  await configured(async () => {
    let calls = 0;
    globalThis.fetch = async (input) => {
      calls++;
      const url = new URL(String(input));
      assert.equal(url.searchParams.get("limit"), "100");
      assert.equal(url.searchParams.get("cursor"), calls === 1 ? null : "next");
      return reply({ version: "1", jobs: [exampleJob()], nextCursor: calls === 1 ? "next" : null });
    };
    assert.equal((await getJobs()).length, 1);
    calls = 0;
    globalThis.fetch = async () => { calls++; return reply({ version: "1", jobs: [], nextCursor: "repeat" }); };
    await assert.rejects(() => getJobs(), (error: unknown) => error instanceof CockpitError && error.code === "invalid_response");
    assert.equal(calls, 2);
    calls = 0;
    globalThis.fetch = async () => reply({ version: "1", jobs: [], nextCursor: `cursor-${++calls}` });
    await assert.rejects(() => getJobs(), (error: unknown) => error instanceof CockpitError && error.code === "unavailable");
    assert.equal(calls, 20);
    globalThis.fetch = async () => reply({ version: "1", jobs: Array.from({ length: 101 }, (_, i) => ({ ...exampleJob(), id: `job-${i}` })), nextCursor: null });
    await assert.rejects(() => getJobs(), (error: unknown) => error instanceof CockpitError && error.code === "invalid_response");
  });
});

test("upstream rate limits retain a bounded retry window", async () => {
  await configured(async () => {
    globalThis.fetch = async () => reply({}, 429, { "retry-after": "99999" });
    await assert.rejects(() => getJob("job-example"), (error: unknown) => error instanceof CockpitError && error.code === "rate_limited" && error.retryAfter === 3600);
    globalThis.fetch = async () => reply({}, 429, { "retry-after": "invalid" });
    await assert.rejects(() => getJob("job-example"), (error: unknown) => error instanceof CockpitError && error.retryAfter === 60);
  });
});
