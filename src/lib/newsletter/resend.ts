import { z } from 'zod';

// The same segment and publication topics used by START Berlin's Cockpit newsletter.
const newsletterSegment = '5b16d5ad-d436-420e-91ea-eb27dae05b18';
const newsletterTopic = '4f8f3bd5-e0ab-4d8c-8e4a-2970ce22274f';
const applicationsTopic = 'e4f87ac4-46e1-43e3-b50d-44c8d241c00b';
const eventsTopic = '2aae7a81-c21b-46b3-a9e7-7707d56b407e';
const acknowledgment = z.object({ id: z.uuid() });
const contactRecord = acknowledgment.extend({ unsubscribed: z.boolean() });
const segmentList = z.object({ data: z.array(acknowledgment) });
const topicList = z.object({ data: z.array(acknowledgment.extend({ subscription: z.enum(['opt_in', 'opt_out']) })) });

export function resendNewsletter(apiKey: string, request: typeof fetch = fetch) {
  function call(path: string, body?: object, idempotencyKey?: string) {
    const headers = new Headers({ Authorization: `Bearer ${apiKey}`, Accept: 'application/json' });
    if (body) headers.set('Content-Type', 'application/json');
    if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey);
    return request(`https://api.resend.com${path}`, {
      method: body ? 'POST' : 'GET',
      body: body ? JSON.stringify(body) : undefined,
      headers,
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    });
  }

  async function requireSuccess(response: Response, operation: string): Promise<unknown> {
    if (!response.ok) throw new Error(`Resend ${operation} returned ${response.status}.`);
    return response.json();
  }

  async function addExistingContact(path: string, response: Response) {
    const contact = contactRecord.parse(await requireSuccess(response, 'contact lookup'));
    if (contact.unsubscribed) return false;
    const topics = topicList.parse(await requireSuccess(await call(`${path}/topics`), 'contact topics'));
    if (topics.data.some((topic) => topic.id === newsletterTopic && topic.subscription === 'opt_out')) return false;

    const segmentPath = `/contacts/${encodeURIComponent(contact.id)}/segments`;
    const added = await call(`${segmentPath}/${newsletterSegment}`, {});
    if (added.ok) return true;
    // A repeat confirmation must succeed when the provider already has this membership.
    if ([409, 422].includes(added.status)) {
      const segments = segmentList.parse(await requireSuccess(await call(segmentPath), 'contact segments'));
      if (segments.data.some((segment) => segment.id === newsletterSegment)) return true;
    }
    throw new Error(`Resend segment assignment returned ${added.status}.`);
  }

  return {
    async sendConfirmation(email: string, link: URL, idempotencyKey: string) {
      const response = await call('/emails', {
        from: 'START Berlin <newsletter@emails.start-berlin.com>',
        to: [email],
        subject: 'Confirm your START Berlin newsletter sign-up',
        text: `Confirm that you want to receive the START Berlin newsletter and application updates:\n\n${link.href}\n\nThe link is valid for 24 hours. If you did not request this email, you can ignore it.`,
        tags: [{ name: 'source', value: 'website_newsletter_signup' }],
      }, idempotencyKey);
      if (response.status === 409 && (await response.json()).name === 'invalid_idempotent_request') return;
      acknowledgment.parse(await requireSuccess(response, 'confirmation email'));
    },

    async subscribe(email: string): Promise<boolean> {
      const path = `/contacts/${encodeURIComponent(email)}`;
      const existing = await call(path);
      if (existing.status !== 404) {
        return addExistingContact(path, existing);
      }

      const created = await call('/contacts', {
        email,
        segments: [{ id: newsletterSegment }],
        topics: [
          { id: newsletterTopic, subscription: 'opt_in' },
          { id: applicationsTopic, subscription: 'opt_in' },
          { id: eventsTopic, subscription: 'opt_out' },
        ],
      });
      if (created.status === 409) {
        return addExistingContact(path, await call(path));
      }
      acknowledgment.parse(await requireSuccess(created, 'contact creation'));
      return true;
    },
  };
}
