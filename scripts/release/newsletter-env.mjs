import { newsletterConfig } from '../../src/lib/newsletter/config.mjs';

const { NEWSLETTER_RESEND_API_KEY, NEWSLETTER_CONFIRMATION_SECRET } = process.env;
const config = newsletterConfig();
if ((NEWSLETTER_RESEND_API_KEY || NEWSLETTER_CONFIRMATION_SECRET) && !config) {
  throw new Error('Configure both the newsletter Resend key and the 32-byte hex confirmation secret.');
}
console.log(config ? 'configured' : 'disabled');
