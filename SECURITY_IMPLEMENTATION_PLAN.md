# Security & Production Readiness Implementation Plan

## Objective

Move SmartphoneCentre from a development-safe prototype to a production-ready
trade-in service without reintroducing client-controlled payouts, fake identity
verification, or plaintext financial data.

## Delivery rules

- Every production database change is shipped as a reviewed Prisma migration.
- Every security control has an automated test before release.
- Provider integrations use authenticated callbacks; the browser is never proof.
- Secrets, encryption keys, and provider credentials are injected only through
  the deployment environment.

## Phase 0 — Release blocker: migration reconciliation

**Scope**

1. Generate a Prisma migration for `AdminUser`, `Quote`, verification proof
   fields, and `AdminAuditLog.adminUserId`.
2. Apply it to a disposable clean database in CI.
3. Add a migration deployment command to the release workflow.
4. Remove or encrypt plaintext payout data in `server/prisma/seed.ts`.

**Acceptance criteria**

- `prisma migrate deploy` succeeds on an empty database.
- `prisma migrate status` reports no unapplied or drifted migrations.
- Seeded payout details are encrypted or non-sensitive placeholders.

## Phase 1 — Authoritative quotes and booking integrity

**Scope**

1. Require a `quoteId` for public booking creation.
2. Load the server-side quote; verify expiry, pricing version, signature,
   model, storage, and declared defects before creating the booking.
3. Atomically mark a quote as consumed so it cannot be replayed.
4. Store the accepted quote version and quote ID with the booking.
5. Add a quote-reissue endpoint for expired quotes.

**Acceptance criteria**

- A forged `finalPrice` or `finalPayoutAmount` never affects a booking.
- An expired, altered, or reused quote is rejected.
- Quote-tampering integration tests pass.

## Phase 2 — Admin identity, sessions, and privileged actions

**Scope**

1. Disable shared PIN login in production.
2. Add named-staff provisioning, password reset, and account deactivation.
3. Add MFA for `SUPER_ADMIN` and `FINANCE_APPROVER` roles.
4. Persist session IDs/token versions and revoke them on logout, password reset,
   deactivation, and suspected compromise.
5. Require two-person approval for payout completion and high-value overrides.
6. Audit all access to unmasked payout details and all approval actions.

**Acceptance criteria**

- A revoked session cannot call an admin endpoint.
- A finance payout cannot complete without two distinct authorized staff users.
- Unmasked payout-detail reads have durable audit records.

## Phase 3 — Payout data and privacy lifecycle

**Scope**

1. Move the payout encryption key to managed secret storage and support key IDs
   plus rotation.
2. Keep payout details masked by default and unmask only for finance roles.
3. Schedule retention jobs to purge payout details after reconciliation.
4. Add consent records: policy version, timestamp, source IP, and purpose.
5. Add customer data export and deletion-request workflows.
6. Document encrypted backups, restore tests, access logs, and incident response.

**Acceptance criteria**

- Production refuses to start without a valid payout encryption key.
- Retention jobs delete eligible payout data and emit an audit event.
- Consent and deletion requests are traceable end-to-end.

## Phase 4 — Real identity verification and pickup safety

**Scope**

1. Select an approved DigiLocker/identity provider and obtain sandbox and
   production credentials.
2. Implement provider authorization redirect/callback handling.
3. Verify callback signatures, timestamps, nonce/state, and audience.
4. Store only a minimal signed proof hash and masked identity attributes.
5. Add pickup-agent OTP/badge verification and a signed chain-of-custody event.
6. Add locked-device, iCloud/FRP, IMEI, and data-wipe guidance before pickup.

**Acceptance criteria**

- Only a verified provider callback can set a booking to `verified`.
- Callback replay and invalid signatures are rejected.
- The UI never claims a simulated identity is verified.

## Phase 5 — Abuse resistance and infrastructure hardening

**Scope**

1. Use Redis or an equivalent shared store for rate limits.
2. Add bot protection to booking, tracking, and login endpoints.
3. Configure explicit production proxy IP/CIDR ranges.
4. Restrict catalog images to an approved CDN/object-storage allowlist.
5. Add upload scanning and signed object-storage upload URLs for condition photos.
6. Send security alerts for authentication anomalies, payout changes, and
   provider-callback failures.

**Acceptance criteria**

- Rate limits work across two application instances.
- Requests from untrusted proxy headers cannot spoof client IPs.
- Unsupported image/upload sources are rejected.

## Phase 6 — Customer operations and product safeguards

**Scope**

1. Add serviceable postcodes, pickup capacity, reschedule/cancel flows, and
   booking tracking with a customer OTP.
2. Add booking lifecycle notifications by configured SMS, WhatsApp, and email
   providers.
3. Add signed data-wipe certificates and inventory disposition states.
4. Add truthful service-area, privacy, terms, cancellation, and grievance pages.
5. Add accessible landmarks, skip links, visible focus states, contrast checks,
   and regional-language support.

**Acceptance criteria**

- A customer can track, reschedule, or cancel only after OTP verification.
- No operational claim is shown without its underlying data/provider.
- Accessibility checks pass keyboard and automated scans.

## Phase 7 — CI/CD, testing, and monitoring

**Scope**

1. Keep typecheck, server tests, dependency audits, and Prisma validation in CI.
2. Add secret scanning, license checks, migration deployment tests, and
   production header/CORS checks.
3. Add integration tests for booking creation, quote tampering, authorization,
   CSRF, rate limits, provider callbacks, and malformed payloads.
4. Add dashboards for pickup SLA, cancellations, payouts pending, agent workload,
   audit failures, and verification failures.

**Acceptance criteria**

- A pull request cannot merge when a required security check fails.
- Production health, audit, and business-operation alerts are actionable.

## Phase 8 — Production infrastructure and deployment

**Target architecture**

```text
Cloudflare (DNS, TLS, Turnstile)
        |
Render paid web service (React static frontend + Node API)
        |-- Supabase Postgres (Prisma)
        |-- Redis / Render Key Value (rate limits, OTPs, sessions, queues)
        |-- Supabase Storage (private photos and wipe certificates)
        |-- Sentry (frontend and API errors)
        |-- SMS provider (transactional notifications)
        `-- Transactional email provider (booking and support messages)
```

**Required services and initial plans**

1. Render Pro workspace with a paid Starter API service; use the same region as
   the database and store all secrets in Render environment variables.
2. Supabase Pro with Postgres, Storage, daily backups, and a production project
   separate from development.
3. Paid Redis-compatible Key Value store; do not use an in-memory limiter in a
   multi-instance deployment.
4. Cloudflare DNS, managed TLS, and Turnstile; restrict each Turnstile widget to
   the production hostnames.
5. Sentry Free initially for frontend and API errors, releases, and alerts.
6. A transactional SMS provider with India DLT support.
7. A transactional email provider, using the existing business domain.

**Deployment tasks**

1. Create separate `development`, `staging`, and `production` environments.
2. Move Prisma from SQLite to PostgreSQL and use the Supabase pooled database
   URL for the API plus a direct URL for migrations.
3. Add migration deployment as a release step before application rollout.
4. Set production secrets in the platform, never in source control:
   `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `PAYOUT_ENCRYPTION_KEY`, Redis
   credentials, provider keys, and allowed origins.
5. Configure a custom API subdomain, HTTPS-only cookies, exact CORS origins,
   Cloudflare DNS, and no wildcard DNS records.
6. Configure uptime checks, error alerts, backup ownership, and quarterly
   restore drills.

**Acceptance criteria**

- Production runs without local SQLite, local files, or development secrets.
- A clean environment can deploy migrations and the API from CI.
- Production, staging, and local databases cannot be confused or shared.

## Phase 9 — Customer notifications: SMS and email

**SMS**

1. Register the business as a Principal Entity on an India DLT portal.
2. Register the Sender ID/header and every transactional template before use.
3. Integrate a transactional SMS provider through the backend only.
4. Send SMS for booking confirmation, tracking OTP, pickup reminder,
   reschedule/cancellation, pickup-agent OTP, and payout completion.
5. Store provider message IDs, delivery status, retry count, and consent basis.
6. Rate limit OTP sends and verification attempts; expire OTPs quickly and store
   only a secure hash.

**Transactional email**

1. Create a dedicated sending subdomain such as `send.<domain>`.
2. Verify the domain with the provider's SPF and DKIM DNS records.
3. Publish DMARC for the primary domain, beginning with monitoring and moving to
   an enforcement policy after validation.
4. Use server-only variables: `RESEND_API_KEY`, `EMAIL_FROM`, and
   `EMAIL_REPLY_TO`; never expose them through Vite or browser code.
5. Replace the browser-side EmailJS notification path with a server-side,
   idempotent notification queue.
6. Use `bookings@<domain>` for automated messages and `support@<domain>` as a
   monitored reply address.
7. Do not include Aadhaar, bank numbers, full address, or payout account details
   in SMS or email.

**Acceptance criteria**

- No notification provider secret appears in client code, commits, or logs.
- Each notification is tied to a booking event and can be retried safely.
- SMS templates are DLT-approved and email domain authentication passes.

## Execution order

1. Phase 0: migration reconciliation.
2. Phase 1: quote integrity.
3. Phase 2 and Phase 3 in parallel once migrations are stable.
4. Phase 4 after provider credentials and legal approval are available.
5. Phase 5 through Phase 9 incrementally before public launch.

## Decisions required from the owner

1. Identity provider and callback credential ownership.
2. Managed database, Redis, object storage/CDN, and secret-manager choice.
3. MFA method and authorized finance approvers.
4. Legal retention periods, consent text, and deletion policy.
5. SMS/WhatsApp/email notification provider and service areas.
6. Render and Supabase accounts, production region, billing owner, and access
   roles.
7. SMS provider, DLT Principal Entity registration, Sender ID, and approved
   transactional templates.
8. Transactional-email provider account and DNS access for SPF, DKIM, and DMARC.
