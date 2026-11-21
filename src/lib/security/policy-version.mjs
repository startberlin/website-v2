import { createHash } from 'node:crypto';
import { securityHeaders } from './headers.mjs';

// Change HTML validators whenever the baseline headers change, including cached pre-fix copies.
export const securityPolicyVersion = createHash('sha256').update(JSON.stringify(securityHeaders)).digest('hex');
