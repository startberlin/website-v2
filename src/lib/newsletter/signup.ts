import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { z } from 'zod';
import {
  createSubmissionRateLimiter, readBoundedBody, submissionRateKey, SubmissionRequestError,
} from '../jobboard/submission-security';
import { newsletterConfig } from './config.mjs';
import { resendNewsletter } from './resend';

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
const linkLifetime = 24 * 60 * 60_000;
const rateLimit = createSubmissionRateLimiter(8);

const results = {
  pending: { status: 202, message: 'Check your inbox for the link to confirm your sign-up.' },
  confirmed: { status: 200, message: "You're subscribed to the START Berlin newsletter." },
  optedOut: { status: 409, message: 'This address has opted out. To rejoin, use the preferences link in a previous START Berlin newsletter or contact us.' },
  invalidEmail: { status: 400, message: 'Enter a valid email address.' },
  invalidLink: { status: 400, message: 'This confirmation link is invalid or has expired. Please sign up again below.' },
  invalidForm: { status: 400, message: 'The form could not be read. Please try again.' },
  forbidden: { status: 403, message: 'Please submit the form from the START Berlin website.' },
  rateLimited: { status: 429, message: 'Too many attempts. Please wait 15 minutes before trying again.' },
  unavailable: { status: 503, message: 'The newsletter sign-up is temporarily unavailable. Please try again later.' },
} as const;

type Result = { status: number; message: string };
export { results as newsletterResults };

function createConfirmation(email: string, secret: Buffer, now: number) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret, iv);
  const payload = Buffer.concat([cipher.update(JSON.stringify({ email, expires: now + linkLifetime })), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), payload]).toString('base64url');
}

export function confirmationEmail(token: string, secret: Buffer, now = Date.now()): string | null {
  if (!/^[A-Za-z0-9_-]{55,520}$/.test(token)) return null;
  try {
    const bytes = Buffer.from(token, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', secret, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const payload = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'));
    if (!Number.isSafeInteger(payload.expires) || payload.expires <= now || payload.expires > now + linkLifetime) return null;
    return emailSchema.safeParse(payload.email).data ?? null;
  } catch {
    return null;
  }
}

export async function handleNewsletterForm(
  request: Request,
  origin: string,
  clientAddress: string,
  config = newsletterConfig(),
  provider = config ? resendNewsletter(config.apiKey) : null,
): Promise<Result> {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (request.headers.get('origin') !== origin || (fetchSite && fetchSite !== 'same-origin')) return results.forbidden;
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/x-www-form-urlencoded') {
    return { ...results.invalidForm, status: 415 };
  }
  if (!config || !provider) return results.unavailable;

  try {
    const form = new URLSearchParams(await readBoundedBody(request, 2048));
    const token = form.get('token');
    if (token !== null) {
      const email = confirmationEmail(token, config.secret);
      if (!email) return results.invalidLink;
      return await provider.subscribe(email) ? results.confirmed : results.optedOut;
    }

    const email = emailSchema.safeParse(form.get('email')).data;
    if (!email || form.getAll('email').length !== 1) return results.invalidEmail;
    if (form.get('website')) return results.pending;
    if (!rateLimit(submissionRateKey(request.headers, clientAddress))) return results.rateLimited;

    const now = Date.now();
    const link = new URL('/newsletter', origin);
    link.searchParams.set('token', createConfirmation(email, config.secret, now));
    // Deduplicate sends to the same address across warm and cold instances within the hour.
    const digest = createHmac('sha256', config.secret).update(email).digest('hex');
    await provider.sendConfirmation(email, link, `website-newsletter/${Math.floor(now / 3_600_000)}/${digest}`);
    return results.pending;
  } catch (error) {
    if (error instanceof SubmissionRequestError) return { ...results.invalidForm, status: error.status };
    console.error(error instanceof Error && /^Resend [\w ]+ returned \d{3}\.$/.test(error.message)
      ? error.message : 'Newsletter service request did not complete.');
    return results.unavailable;
  }
}
