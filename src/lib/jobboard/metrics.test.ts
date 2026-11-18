import assert from "node:assert/strict";
import test from "node:test";
import { jobboardMetricsState } from "./api";
import { recordJobNavigation } from "./metrics";

test("measurement uses a dedicated credential and a bounded, anonymous event after a successful navigation", async () => {
  const previous = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    process.env.COCKPIT_API_URL = "https://cockpit.example.test";
    process.env.JOBBOARD_READ_API_KEY = "r".repeat(32);
    process.env.JOBBOARD_SUBMIT_API_KEY = "s".repeat(32);
    process.env.JOBBOARD_METRICS_API_KEY = "m".repeat(32);
    const randomEvents: Record<string, unknown>[] = [];
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), "https://cockpit.example.test/api/jobboard/v1/metrics");
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("authorization"), `Bearer ${process.env.JOBBOARD_METRICS_API_KEY}`);
      for (const field of ["cookie", "referer", "x-forwarded-for", "user-agent"]) assert.equal(headers.get(field), null);
      assert.notEqual(init?.signal, undefined);
      randomEvents.push(JSON.parse(String(init?.body)).events[0]);
      if (randomEvents.length === 1) return new Response(null, { status: 503 });
      return Response.json({ version: "1", accepted: 1 });
    };
    const browser = (override: Record<string, string> = {}) => new Request("https://website.example.test/jobs?source=private-input&q=private-search", {
      headers: { accept: "text/html", "user-agent":"Mozilla/5.0", cookie:"private-cookie", referer:"https://private.example.test/path", ...override },
    });
    const board = {type:"board_request"} as const;
    process.env.JOBBOARD_METRICS_ENABLED = "false";
    assert.equal(jobboardMetricsState(), "disabled");
    assert.equal(recordJobNavigation(browser(), 200, board), undefined);
    process.env.JOBBOARD_METRICS_ENABLED = "true";
    process.env.JOBBOARD_METRICS_API_KEY = process.env.JOBBOARD_READ_API_KEY;
    assert.equal(jobboardMetricsState(), "misconfigured");
    assert.equal(recordJobNavigation(browser(), 200, board), undefined);
    process.env.JOBBOARD_METRICS_API_KEY = "m".repeat(32);
    assert.equal(jobboardMetricsState(), "configured");
    for (const headers of [{"dnt":"1"}, {"sec-gpc":"1"}, {"sec-purpose":"prefetch"}, {"user-agent":"Googlebot"}, {accept:"application/json"}] as Record<string,string>[]) {
      assert.equal(recordJobNavigation(browser(headers),200,board),undefined);
    }
    assert.equal(recordJobNavigation(browser(),503,board),undefined);
    assert.equal(recordJobNavigation(browser(),308,{type:"detail_request",jobId:"jbj_test"}),undefined);
    assert.equal(randomEvents.length,0);
    await recordJobNavigation(browser(),200,board);
    assert.equal(randomEvents.length,2);
    assert.deepEqual(randomEvents[0],randomEvents[1]);
    assert.deepEqual(Object.keys(randomEvents[0]).sort(),["eventId","jobId","occurredAt","source","surface","type"]);
    assert.equal(randomEvents[0].source,"unknown");
    assert.equal(randomEvents[0].jobId,null);
    await recordJobNavigation(browser(),303,{type:"share_redirect",jobId:"jbj_test",channel:"linkedin"});
    assert.equal(randomEvents.at(-1)?.source,"linkedin");
    assert.notEqual(randomEvents[0].eventId,randomEvents.at(-1)?.eventId);
    assert.doesNotMatch(JSON.stringify(randomEvents), /private-/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of ["COCKPIT_API_URL","JOBBOARD_METRICS_ENABLED","JOBBOARD_METRICS_API_KEY","JOBBOARD_READ_API_KEY","JOBBOARD_SUBMIT_API_KEY"]) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});
