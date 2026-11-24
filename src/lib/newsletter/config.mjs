/** @param {NodeJS.ProcessEnv} env */
export function newsletterConfig(env = process.env) {
  const apiKey = env.NEWSLETTER_RESEND_API_KEY?.trim();
  const secret = env.NEWSLETTER_CONFIRMATION_SECRET?.trim();
  if (!apiKey || !/^re_[A-Za-z0-9_-]+$/.test(apiKey) || !secret || !/^[a-f0-9]{64}$/i.test(secret)) return null;
  return { apiKey, secret: Buffer.from(secret, 'hex') };
}
