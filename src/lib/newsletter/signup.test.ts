import assert from 'node:assert/strict';
import test from 'node:test';
import { newsletterConfig } from './config.mjs';
import { resendNewsletter } from './resend';
import { confirmationEmail, handleNewsletterForm, newsletterResults } from './signup';

const origin = 'https://staging.start-berlin.com';
const email = 'reader@example.test';
const contactId = '2c90a00a-c4dd-4a3e-8c22-c865fb001ded';
const config = { apiKey: 're_TEST_ONLY', secret: Buffer.alloc(32, 123) };
const clientAddress = '192.0.2.1';

function form(values: Record<string, string>, from = origin) {
  return new Request(`${origin}/newsletter`, {
    method: 'POST', headers: { Origin: from }, body: new URLSearchParams(values),
  });
}

test('submitting an address sends confirmation without adding a contact, and confirming enrolls in the existing segment', async () => {
  const requests: Array<{ path: string; method?: string; body?: string; key: string | null }> = [];
  const provider = resendNewsletter(config.apiKey, async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, 'https://api.resend.com');
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('authorization'), `Bearer ${config.apiKey}`);
    requests.push({ path: url.pathname, method: init?.method, body: init?.body as string, key: headers.get('idempotency-key') });
    if (init?.method === 'GET') return new Response(null, { status: 404 });
    return Response.json({ id: contactId });
  });

  assert.equal(await handleNewsletterForm(form({ email: ` ${email.toUpperCase()} ` }), origin, clientAddress, config, provider), newsletterResults.pending);
  assert.deepEqual(requests.map(({ path }) => path), ['/emails']);
  const message = JSON.parse(requests[0].body!);
  assert.deepEqual(message.to, [email]);
  assert.match(requests[0].key!, /^website-newsletter\/\d+\/[a-f0-9]{64}$/);
  assert.ok(!requests[0].key!.includes(email));
  const confirmationUrl = new URL(message.text.match(/https:\/\/\S+/)[0]);
  assert.equal(confirmationUrl.origin, origin);
  assert.ok(message.html.includes(`href="${confirmationUrl.href}"`));
  assert.ok(message.html.includes(`src="${origin}/social/start-berlin-logo.png"`));
  assert.match(message.html, /Confirm my sign-up/);
  assert.match(message.html, /valid for 24 hours/);
  const token = confirmationUrl.searchParams.get('token')!;
  assert.equal(confirmationEmail(token, config.secret), email);
  const tampered = `${token[0] === 'A' ? 'B' : 'A'}${token.slice(1)}`;
  assert.equal(confirmationEmail(tampered, config.secret), null);
  assert.equal(confirmationEmail(token, config.secret, Date.now() + 24 * 60 * 60_000), null);
  assert.equal(await handleNewsletterForm(form({ token: tampered }), origin, clientAddress, config, provider), newsletterResults.invalidLink);
  assert.equal(requests.length, 1);

  assert.equal(await handleNewsletterForm(form({ token }), origin, clientAddress, config, provider), newsletterResults.confirmed);
  assert.deepEqual(requests.slice(1).map(({ method, path }) => [method, path]), [['GET', '/contacts/reader%40example.test'], ['POST', '/contacts']]);
  assert.deepEqual(JSON.parse(requests[2].body!), {
    email,
    segments: [{ id: '5b16d5ad-d436-420e-91ea-eb27dae05b18' }],
    topics: [
      { id: '4f8f3bd5-e0ab-4d8c-8e4a-2970ce22274f', subscription: 'opt_in' },
      { id: 'e4f87ac4-46e1-43e3-b50d-44c8d241c00b', subscription: 'opt_in' },
      { id: '2aae7a81-c21b-46b3-a9e7-7707d56b407e', subscription: 'opt_out' },
    ],
  });
});

test('preserves global and newsletter opt-outs and handles existing newsletter membership', async () => {
  const newsletter = '5b16d5ad-d436-420e-91ea-eb27dae05b18';
  let globalOptOut = true;
  let topicOptOut = true;
  let segmentWrites = 0;
  const provider = resendNewsletter(config.apiKey, async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith('/topics')) return Response.json({ data: [{ id: '4f8f3bd5-e0ab-4d8c-8e4a-2970ce22274f', subscription: topicOptOut ? 'opt_out' : 'opt_in' }] });
    if (path.endsWith('/segments')) return Response.json({ data: [{ id: newsletter }] });
    if (init?.method === 'POST') {
      assert.ok(path.endsWith(`/segments/${newsletter}`));
      segmentWrites++;
      return new Response(null, { status: 409 });
    }
    return Response.json({ id: contactId, unsubscribed: globalOptOut });
  });
  assert.equal(await provider.subscribe(email), false);
  globalOptOut = false;
  assert.equal(await provider.subscribe(email), false);
  assert.equal(segmentWrites, 0);
  topicOptOut = false;
  assert.equal(await provider.subscribe(email), true);
  assert.equal(segmentWrites, 1);
});

test('invalid, cross-origin, oversized and disabled requests never reach Resend', async () => {
  const provider = resendNewsletter(config.apiKey, async () => { assert.fail('Resend was called'); });
  assert.equal(await handleNewsletterForm(form({ email: 'invalid' }), origin, clientAddress, config, provider), newsletterResults.invalidEmail);
  assert.equal(await handleNewsletterForm(form({ email }, 'https://another.example'), origin, clientAddress, config, provider), newsletterResults.forbidden);
  assert.equal(await handleNewsletterForm(form({ email: 'x'.repeat(2_049) }), origin, clientAddress, config, provider).then(result => result.status), 413);
  assert.equal(await handleNewsletterForm(form({ email, website: 'filled' }), origin, clientAddress, config, provider), newsletterResults.pending);
  assert.equal(await handleNewsletterForm(form({ email }), origin, clientAddress, null), newsletterResults.unavailable);
  assert.equal(newsletterConfig({ NEWSLETTER_RESEND_API_KEY: 're_TEST_ONLY' }), null);
});

test('native no-referrer form posts require same-origin browser metadata and the configured host', async () => {
  const provider = resendNewsletter(config.apiKey, async () => Response.json({ id: contactId }));
  const nativeForm = (fetchSite: string | undefined, target = origin) => new Request(`${target}/newsletter`, {
    method: 'POST',
    headers: { Origin: 'null', ...(fetchSite ? { 'Sec-Fetch-Site': fetchSite } : {}) },
    body: new URLSearchParams({ email }),
  });
  assert.equal(await handleNewsletterForm(nativeForm('same-origin'), origin, clientAddress, config, provider), newsletterResults.pending);
  assert.equal(await handleNewsletterForm(nativeForm('same-site'), origin, clientAddress, config, provider), newsletterResults.forbidden);
  assert.equal(await handleNewsletterForm(nativeForm('cross-site'), origin, clientAddress, config, provider), newsletterResults.forbidden);
  assert.equal(await handleNewsletterForm(nativeForm(undefined), origin, clientAddress, config, provider), newsletterResults.forbidden);
  assert.equal(await handleNewsletterForm(nativeForm('same-origin', 'https://another.example'), origin, clientAddress, config, provider), newsletterResults.forbidden);
});

test('only a successful or already accepted Resend send acknowledges a request', async (context) => {
  context.mock.method(console, 'error', () => {});
  const rejected = resendNewsletter(config.apiKey, async () => Response.json({ name: 'validation_error' }, { status: 403 }));
  const accepted = resendNewsletter(config.apiKey, async () => Response.json({ name: 'invalid_idempotent_request' }, { status: 409 }));
  assert.equal(await handleNewsletterForm(form({ email }), origin, clientAddress, config, rejected), newsletterResults.unavailable);
  assert.equal(await handleNewsletterForm(form({ email }), origin, clientAddress, config, accepted), newsletterResults.pending);
});
