# SECURITY.md: Universal Security Guideline for AI Coding Agents

**Priority: Security is the #1 priority.** When security conflicts with convenience, speed, or aesthetics, security wins.
This document is language-, framework-, and architecture-agnostic. Apply the principles using the idioms of whatever stack the project uses.

---

## 0. Rules of Engagement (read first)

1. **Secure only what exists.** Audit and harden code, config, and infrastructure that are *already present*. Do **not** add features (payments, auth, uploads, databases, etc.) just to secure them. If a section below does not apply to the project, skip it.
2. **Do not break behavior.** Hardening must preserve intended functionality. Run existing tests/build after each change; add tests for security fixes where a test framework exists.
3. **Never weaken security to make something work** (disabling TLS verification, loosening CSP to `*`, commenting out auth checks, `--no-verify`, `chmod 777`, wildcard CORS, etc.). If a fix seems to require this, stop and report instead.
4. **Make minimal, reviewable changes.** One concern per change; explain the vulnerability, the fix, and any residual risk.
5. **Never invent or print secrets.** Never commit real credentials, tokens, or keys, including in tests, examples, docs, or logs.
6. **Report, don't hide.** List findings you could not or should not fix automatically (breaking changes, architectural issues, items requiring human/infra action) with severity and a recommended remediation.
7. **Fail closed.** On error, ambiguity, or missing config, deny access / refuse to start rather than falling back to an insecure default.
8. **Treat all external data as hostile**: user input, URL params, headers, cookies, uploaded files, webhooks, third-party API responses, DB contents written by users, LLM output, and environment of untrusted clients.

---

## 0A. Security First (Universal)

1. Security is always a **first-class concern**, not an afterthought. Consider it while designing and writing every change, not only in a final review.
2. Never hardcode API keys, secrets, tokens, passwords, or private keys.
3. Store sensitive secrets securely (system keychain, or cloud/platform-provided secret storage).
4. Sanitize and validate **all** external inputs (user input, third-party API responses, file uploads, webhooks, URL params, headers).
5. Secure networking: HTTPS, a sound TLS configuration, and timeouts and bounded retries on every outbound call.
6. Follow the best-practice security standards for the stack (e.g. OWASP for web, platform guidelines for mobile and desktop).
7. Always assume the client is **malicious**.
8. Always ask: *"Could this be abused, leaked, or misused?"*
9. **Mandatory security verification after every major feature integration** (a change that creates or modifies more than ~10 files). The agent must:
   1. Implement all applicable security measures for the new code.
   2. Run security checks: linters and SAST, dependency and secret scans, and the checklist in Section 18.
   3. Run penetration-style tests against the new surface (injection, broken access control/IDOR, auth bypass, rate-limit and abuse, race conditions, malformed and oversized input, SSRF where relevant). Do this **only against local or staging environments and systems you own or are explicitly authorized to test, never production or third-party systems**.
   4. Fix every finding it can, re-test, and repeat until no known issues remain.
   5. Generate or update `SECURITY.md` with a detailed report (format in Section 19) of all measures implemented, tests performed and their results, and residual risks.
   
   No system can be proven bullet-proof. Do not claim it is. State what was tested, what passed, and what risk remains, and never mark a check as passed unless it was actually run.

## 0B. Persistent Security Rules

1. Treat security configuration and rules (database/storage rules, RLS policies, CORS, CSP, IAM, firewall, CI permissions) as **production code**: reviewed, tested, and never casually loosened.
2. Write explicit rules for every endpoint, service, and database/storage access path. Anything without an explicit rule is denied.
3. Keep security rules under version control, review them thoroughly on every change, and update them whenever endpoints, data models, or roles change so the rules never drift from the code.

---

## 1. Core Principles

- **Defense in depth**: several independent layers; no single control is trusted alone.
- **Least privilege**: users, services, tokens, DB roles, CI jobs, and API keys get only the permissions they need.
- **Secure by default / default deny**: access is granted explicitly, never implicitly.
- **Never trust the client**: UI checks are convenience only; every rule is enforced server-side (or in the data layer).
- **Minimize attack surface and data**: remove unused routes, dependencies, endpoints, debug code, and permissions; collect and store the minimum data, for the minimum time.
- **Keep it simple**: prefer well-vetted libraries and platform features over custom security code. **Never roll your own crypto.**

---

## 2. Secrets & Configuration

- No secrets in source code, client bundles, git history, logs, error messages, URLs, or build artifacts. If a secret was ever committed, treat it as compromised: **rotate it**, then remove it.
- Load secrets from environment variables or a secrets manager; validate required config at startup and fail fast if missing or malformed.
- Separate secrets per environment (dev/staging/prod) and keep test and live credentials strictly apart.
- Only intentionally public identifiers may be exposed to the browser (e.g. via `NEXT_PUBLIC_`/`VITE_`/`REACT_APP_` style prefixes). Never prefix a secret with such a marker. Keep server-only config in modules that cannot be imported from client code.
- `.env*` and key files must be in `.gitignore`; provide a `.env.example` with placeholders only.
- Enable secret scanning (pre-commit hook and/or CI, e.g. gitleaks/trufflehog) when tooling exists.
- Use scoped, short-lived, rotatable credentials. One key per purpose and per service.

---

## 3. Input Validation, Output Encoding & Injection

**Validate on the server, always** (client validation is UX only). Use allow-lists over deny-lists, validate type, length, range, format, and enum membership, using a schema library (Zod, Joi, Pydantic, Bean Validation, etc.). Reject, don't "fix", invalid input. Normalize (trim, case, Unicode) *before* validating, and clamp numeric parameters (sizes, page limits, dimensions) to safe ranges.

Prevent each injection class at its root:

| Class | Required defense |
|---|---|
| **SQL / NoSQL injection** | Parameterized queries / prepared statements / ORM bindings only. Never concatenate input into queries. Reject operator objects in NoSQL inputs (`$ne`, `$where`). |
| **XSS** | Context-aware output encoding (HTML, attribute, JS, URL, CSS). Use framework auto-escaping; avoid `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `eval`, `new Function`, `document.write`. If raw HTML is unavoidable, sanitize with a maintained sanitizer (e.g. DOMPurify) with a strict allow-list. |
| **XML / SVG / template injection** | Escape all interpolated values; disable external entities/DTDs in XML parsers (XXE); never build templates from user input (SSTI). |
| **Command injection** | Avoid shelling out. If required, use argument arrays (no shell), allow-listed commands and args. |
| **Path traversal** | Never use user input in file paths directly; resolve to canonical path and verify it stays inside an allowed base directory; prefer generated IDs over user filenames. |
| **SSRF** | For server-side fetches of user-supplied URLs: allow-list schemes/hosts, resolve DNS and block private/loopback/link-local/metadata ranges (127.0.0.0/8, 10/8, 172.16/12, 192.168/16, 169.254.169.254, ::1, etc.), disable or re-validate redirects, set timeouts and size limits. |
| **Open redirect** | Redirect only to allow-listed or relative internal paths. |
| **Unsafe deserialization** | Never deserialize untrusted data with native object serializers (pickle, Java serialization, `eval`-style YAML). Use JSON with schema validation. |
| **Prototype pollution / mass assignment** | Pick allowed fields explicitly; never spread/merge raw request bodies into models or config; block `__proto__`, `constructor`, `prototype` keys. |
| **ReDoS** | Avoid catastrophic regexes on user input; bound input length first. |
| **Header / log injection (CRLF)** | Strip or reject newlines in values placed into headers or logs. |

Resource-exhaustion limits: max request body size, max JSON depth, max array length, max upload size, pagination caps, and timeouts on every outbound call and expensive operation.

---

## 4. Authentication

*(Apply only if the project has authentication.)*

- Prefer a proven provider/library (OIDC/OAuth 2.1, passkeys/WebAuthn, managed auth) over custom implementations.
- Passwords: min length ≥ 12 (length over arbitrary complexity rules, allow passphrases, up to 64+ chars); check against breached-password lists where possible; hash with **Argon2id** (or scrypt/bcrypt with strong cost); unique salt per hash; never store, log, or email plaintext passwords.
- Offer/support MFA (passkeys or TOTP preferred over SMS) especially for admin and sensitive actions.
- Constant-time comparison for secrets, tokens, and signatures.
- Generic error messages for login/reset ("invalid credentials") to avoid account enumeration; keep response timing similar.
- Brute-force protection: rate limit and progressively delay/lock per account **and** per IP.
- Password reset/email verification: single-use, short-lived, high-entropy tokens (≥128 bits CSPRNG), stored hashed, invalidated after use and on password change.
- Re-authenticate for sensitive actions (change email/password, delete account, payments).
- OAuth: use Authorization Code + PKCE; validate `state`, `nonce`, redirect URIs (exact match), and token audience/issuer.
- Account deletion must really remove or anonymize associated data.

## 5. Sessions, Tokens & Cookies

- Session IDs/tokens: CSPRNG, ≥128 bits, rotated on login and privilege change, invalidated on logout and server-side on expiry.
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`; `None` only when required, with `Secure`), narrow `Path`/`Domain`, `__Host-` prefix when possible, sensible expiry (idle + absolute timeouts).
- JWTs: pin allowed algorithms (reject `none`, avoid alg confusion), verify signature, `iss`, `aud`, `exp`, `nbf`; short-lived access tokens with rotating refresh tokens and reuse detection; keep sensitive data out of the payload; have a revocation strategy. Prefer HttpOnly cookies over `localStorage` for tokens.
- **Never store secrets, tokens, or sensitive PII in `localStorage`/`sessionStorage`** (readable by any XSS). Non-sensitive preferences only.
- **CSRF**: for cookie-authenticated, state-changing requests use SameSite cookies **plus** anti-CSRF tokens (or verify `Origin`/`Fetch-Metadata` headers). State changes never via GET.

## 6. Authorization & Access Control

- **Enforce on every request, server-side, at the data layer where possible**: deny by default.
- Prevent **IDOR/BOLA**: always verify the authenticated principal owns or may access the specific object ID; derive user identity from the session/token, never from a client-supplied user ID.
- Prevent function-level escalation: admin/privileged routes and actions require explicit role/permission checks; paid/gated features are gated on the server, not just hidden in the UI.
- Prevent vertical/horizontal privilege escalation via mass assignment (never accept `role`, `isAdmin`, `price`, `credits`, `ownerId` from clients).
- Backend-as-a-service / database-native rules (Firestore rules, Supabase RLS, storage policies, row-level policies): **RLS/rules must be enabled and default-deny on every table/collection/bucket**, scoped by authenticated user, with schema/field validation. Never ship with permissive test rules (`allow read, write: if true`). Never expose service-role/admin keys to clients.
- Multi-tenant systems: tenant ID is enforced in every query.
- Log and alert on authorization failures.

---

## 7. Transport, Headers & Browser Security

- **HTTPS everywhere**; redirect HTTP→HTTPS; TLS 1.2+ (prefer 1.3); no mixed content; never disable certificate verification.
- Set these headers globally (middleware/server/CDN config), tailored per app:

| Header | Recommended value / purpose |
|---|---|
| `Content-Security-Policy` | Strict, allow-list based: `default-src 'self'`; `script-src` with nonces/hashes (+ `'strict-dynamic'`), **no** `'unsafe-inline'`/`'unsafe-eval'` for scripts; `object-src 'none'`; `base-uri 'none'` or `'self'`; `frame-ancestors 'none'` (or specific origins); `form-action 'self'`; `upgrade-insecure-requests`. Roll out via `Report-Only` first if risky. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (only add `preload` once all subdomains are HTTPS-only) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (or stricter) |
| `Permissions-Policy` | Disable unused features (camera, microphone, geolocation, payment, USB, etc.) |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` (or `same-site`) unless resources are intentionally shared |
| `Cross-Origin-Embedder-Policy` | `require-corp`, only if cross-origin isolation is needed |
| `X-Frame-Options` | `DENY` (legacy fallback alongside CSP `frame-ancestors`) |
| `Cache-Control` | `no-store` on authenticated/sensitive responses |

- Remove information-leaking headers (`X-Powered-By`, server version banners).
- **CORS**: never `Access-Control-Allow-Origin: *` together with credentials; reflect only exact allow-listed origins; limit methods and headers; handle `OPTIONS` preflight; don't enable CORS for endpoints that don't need it.
- Third-party scripts/styles: minimize; pin versions; use **Subresource Integrity (SRI)** for CDN-loaded assets; load with `crossorigin` as needed. Prefer self-hosting.
- Links with `target="_blank"` use `rel="noopener noreferrer"`.
- Sandbox untrusted iframes (`sandbox` attribute); validate `postMessage` origins and data.
- Forms/inputs: appropriate `autocomplete` attributes; never put secrets in URLs or query strings.

---

## 8. APIs & Backend Services

- Authenticate and authorize every endpoint; no "hidden" unauthenticated admin/debug/health routes exposing internals.
- Use correct HTTP methods and status codes; validate `Content-Type`; reject unexpected content types.
- **Rate limiting & abuse protection** on all public endpoints, with stricter limits for auth, password reset, checkout, email/SMS sending, search, and expensive operations (e.g. sliding window per IP **and** per account/API key; backed by shared store such as Redis in multi-instance/serverless setups). Return `429` with `Retry-After`. Add bot protection (CAPTCHA/App Check/Turnstile) where abuse is likely.
- Bound pagination, filtering, and sorting; avoid unbounded queries; guard against GraphQL depth/complexity abuse and disable introspection in production where unneeded; limit batch sizes.
- Prefer idempotent operations; use idempotency keys for payments/side effects.
- Race conditions: use atomic operations/transactions/row locks/optimistic concurrency for balances, credits, inventory, one-time tokens (e.g. a single atomic check-and-decrement).
- Return minimal data (explicit response DTOs): never leak internal fields, hashes, tokens, or other users' data.
- Version APIs and remove deprecated, unused endpoints.
- Timeouts, retries with backoff, and circuit breakers for outbound calls; validate third-party responses.

## 9. Webhooks & Payments

*(Only if present.)*

- Verify webhook signatures on the **raw request body** with the provider's official library; enforce timestamp tolerance; reject unsigned/invalid requests; use constant-time comparison.
- Make handlers **idempotent** (store processed event/session IDs) and tolerate retries and out-of-order events.
- Never trust client-reported payment status or prices: compute amounts server-side, verify payment state server-side with the provider before granting entitlements.
- Never store or log card data (PAN/CVV); use hosted checkout/tokenization (stay out of PCI scope). Never expose secret/restricted keys client-side.
- Keep test and live modes/keys/webhook secrets strictly separate.
- Webhook endpoints are server-to-server: no CORS, no cookies, minimal surface.

## 10. File Uploads & Media Processing

*(Only if present.)*

- Enforce max size, count, and allow-listed extensions **and** verify real content type via magic bytes; never trust client `Content-Type` or filename.
- Generate random server-side filenames; strip path components; store outside the web root or in private object storage; serve with correct `Content-Type`, `X-Content-Type-Options: nosniff`, and `Content-Disposition: attachment` where appropriate.
- Serve user content from a separate domain/origin or sandboxed bucket to isolate it from the app origin.
- Re-encode/sanitize images (strip EXIF/metadata, especially GPS); sanitize or rasterize SVG (never serve user SVG inline); scan for malware where appropriate; guard against decompression bombs and oversized dimensions.
- Storage access: per-user path scoping and signed, short-lived URLs; private by default.
- Limit resources used by image/PDF/video processors (memory, CPU time, pixel count); run in isolated workers if possible.

---

## 11. Data Protection & Privacy

- Classify data; collect and retain only what is necessary; define retention and deletion paths (right to erasure) for GDPR/CCPA-style obligations.
- Encrypt in transit (TLS) and at rest (managed disk/DB encryption); use field-level encryption for highly sensitive values using authenticated encryption (AES-256-GCM / XChaCha20-Poly1305), with keys managed by a KMS, never hard-coded.
- Hashing for integrity/identification: SHA-256+ (never MD5/SHA-1 for security); HMAC for message authentication; CSPRNG (`crypto.randomBytes`, `secrets`, `SecureRandom`) for tokens, **never** `Math.random`/`rand()` for security purposes.
- Mask or omit PII in logs, analytics, and error reports (e.g. `a***@example.com`); never log passwords, tokens, session IDs, full card numbers, or secret keys; avoid logging full request bodies.
- Third-party analytics/tracking: only with legal basis/consent where required; no data sent to third parties without need; disclose in privacy policy.
- Backups encrypted, access-controlled, and tested for restore.
- Prefer stateless designs and avoid storing data you do not need.

## 12. Error Handling, Logging & Monitoring

- Show users generic errors; log details server-side. No stack traces, SQL errors, file paths, framework versions, or internal IDs in responses. **Debug mode, verbose errors, and dev tools disabled in production.**
- Centralized logging utility with structured logs, correlation IDs, and redaction.
- Log security events: auth success/failure, permission denials, password/email changes, privilege changes, rate-limit hits, webhook verification failures, suspicious input. Protect logs from tampering and injection; set retention.
- Set up alerting/monitoring for anomalies (spikes in 401/403/429/5xx); handle uncaught exceptions and promise rejections without leaking information or leaving the app in an unsafe state.

---

## 13. Dependencies & Supply Chain

- Install only necessary, well-maintained, reputable packages; check for typosquatting; prefer fewer dependencies; remove unused ones.
- **Commit lockfiles** and use deterministic installs (`npm ci`, `pip install --require-hashes`/lock, `cargo --locked`, etc.). Pin versions (avoid `latest`, wildcards, and untrusted git/URL dependencies).
- Run vulnerability audits regularly and in CI (`npm audit`/`pnpm audit`, `pip-audit`, `cargo audit`, `govulncheck`, OSV-Scanner, Dependabot/Renovate). Fix or document high/critical issues; keep frameworks, runtimes, and base images patched and on supported versions.
- Be careful with install scripts (`postinstall`); consider `--ignore-scripts` where feasible; use package registry provenance/signature checks when available.
- CI/CD hardening: pin third-party CI actions/images to commit SHAs/digests; least-privilege CI tokens; secrets only for trusted branches; no secrets in PR builds from forks; protect main branches (required reviews, status checks, signed commits where possible); generate an SBOM for releases when practical.
- Containers: minimal base images (distroless/alpine), run as non-root, read-only filesystem where possible, drop capabilities, no secrets baked into images, scan images.

## 14. Deployment & Infrastructure

- Production ≠ development: separate environments, credentials, databases, and domains. Never point dev/test code at production data.
- Disable or remove: debug endpoints, admin consoles on public interfaces, directory listings, default accounts/passwords, sample data, source maps (or upload them privately to error tracking only), test routes, and verbose framework banners.
- Network: expose only required ports; databases/caches/queues are **not** publicly reachable (private network / allow-listed IPs / TLS + auth); use a WAF/CDN/DDoS protection where appropriate.
- Cloud/IAM: least-privilege roles per service; no wildcard (`*`) permissions; no long-lived keys where workload identity is possible; private object storage by default; enable audit logging (e.g. CloudTrail) and MFA for human admin accounts.
- Infrastructure as code reviewed and scanned (tfsec/checkov/etc.).
- Secure DNS and domains: enable DNSSEC/registrar lock where available; set SPF, DKIM, and DMARC for sending domains; guard against subdomain takeover (remove dangling DNS records); consider CAA records.
- Regular patching, automated backups, tested rollback, and an incident response plan (contacts, key-rotation procedure, `security.txt` at `/.well-known/security.txt` for vulnerability disclosure).
- Serverless/edge: validate inputs the same way; set memory/time limits; avoid sharing mutable global state across requests; keep secrets in the platform's secret store.

---

## 15. Client-Side & Frontend Specifics

- Treat all client code and bundles as public: no secrets, hidden API keys with elevated privilege, or "security by obscurity".
- Don't trust client-side feature flags, prices, roles, or entitlements.
- Avoid rendering unsanitized user content; sanitize Markdown/HTML (disallow scripts, event handlers, `javascript:` URLs; validate URL schemes to `http(s)`/`mailto`).
- Don't expose sensitive info in HTML comments, `data-*` attributes, console logs, or client error messages.
- Keep browser storage for non-sensitive data only; clear client state on logout.
- Validate and encode data used in `window.location`, `postMessage`, and dynamic imports.
- Use framework-provided protections (auto-escaping, CSRF, router guards as UX only) and keep frameworks updated.

## 16. Native, Desktop & Mobile Apps

*(Only if present.)*

- **Electron/webview apps**: `contextIsolation: true`, `nodeIntegration: false`, enable `sandbox` wherever possible, minimal `contextBridge` surface, validate every IPC message in the main process (typed channels, no user-controlled channel names), strict CSP in renderers, disable `remote`/dev tools in production, restrict navigation and `window.open` (`will-navigate`, `setWindowOpenHandler`), never load remote content with Node privileges, enable Electron Fuses, code-sign binaries, and use signed auto-updates over HTTPS only.
- **Mobile**: store secrets in Keychain/Keystore (never plain preferences/files); use certificate pinning for high-risk apps; validate deep links/intents and URL schemes; disable backups of sensitive data; avoid logging sensitive data; request minimum permissions; obfuscate/hardened release builds; check jailbreak/root only as defense in depth (not as a trust anchor).
- Build-time secret injection (`--dart-define`, CI secrets) is acceptable only for non-secret client identifiers; truly secret values stay on a server.
- Any local license/entitlement scheme is bypassable: do not rely on it for protecting sensitive server-side value; enforce server-side where it matters.
- Collect only needed OS permissions/telemetry; document precisely what is collected.

## 17. AI / LLM Features

*(Only if the project uses LLMs or AI agents.)*

- Treat all model input and output as untrusted: guard against **prompt injection** (including indirect injection via documents, web pages, emails, tool results). Never let model output be executed (SQL, shell, code) or rendered as HTML without validation/sanitization.
- Give agents/tools least privilege; require human confirmation for destructive, financial, or externally visible actions; scope tool credentials per user.
- Don't put secrets or other users' data into prompts; apply per-user data isolation in retrieval (RAG) and enforce authorization before retrieval, not after generation.
- Rate-limit and cap tokens/cost per user; log (redacted) prompts/responses for abuse detection; keep API keys server-side.
- Validate structured outputs against schemas.

---

## 18. Testing & Verification

Before declaring work done, verify with the tooling available:

- [ ] Build, type-check, lint, and existing tests all pass.
- [ ] Dependency audit shows no unaddressed high/critical vulnerabilities.
- [ ] Secret scan shows no credentials in code or history; `.env` ignored.
- [ ] Every user-controlled input path is validated server-side and encoded on output.
- [ ] Every protected route/object/action has server-side authentication **and** authorization checks (try accessing another user's resource, expecting 403/404).
- [ ] Security headers present and CSP does not break the app (check browser console / `securityheaders.com`-style scan).
- [ ] CORS limited to explicit origins; cookies have `HttpOnly`/`Secure`/`SameSite`.
- [ ] Rate limits trigger on sensitive endpoints; concurrency-sensitive operations behave atomically (e.g. N parallel requests consume exactly the allowed amount).
- [ ] Error responses leak no internals; production has debug disabled; logs contain no secrets/PII.
- [ ] Database/storage rules are default-deny and tested with unauthenticated and wrong-user requests.
- [ ] SAST/DAST/IaC scanners (CodeQL, Semgrep, ZAP, etc.) run in CI where available, and findings are triaged.
- [ ] Add regression tests for each fixed vulnerability where feasible.

Review against **OWASP Top 10 (2021+) / OWASP API Security Top 10 / OWASP ASVS** as the baseline checklist.

---

## 19. Reporting Template for Agents

After every security pass (and always after a major feature integration, see Section 0A.9), write or update the project's `SECURITY.md` with:

1. **Scope reviewed**: what exists in the project and which sections of this guide applied; date and the feature(s) covered.
2. **Security measures implemented**: grouped by area (auth, input validation, headers, rate limiting, secrets, etc.), each with where it lives in the code.
3. **Checks and pentests performed**: tools and manual tests run, the environment used, and the results (pass/fail, with evidence such as concurrency or access-control test outcomes).
4. **Fixed**: vulnerability, location, fix, and verification.
5. **Not fixed / needs human action**: finding, severity (Critical/High/Medium/Low), why, and recommended remediation.
6. **Residual risks & recommendations**: e.g. key rotation needed, infra settings, monitoring to add.

*Security is continuous: re-audit on every dependency update, feature addition, and infrastructure change.*
