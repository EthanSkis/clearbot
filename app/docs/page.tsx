import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import {
  Callout,
  Code,
  H2,
  H3,
  LI,
  P,
  Pre,
  Step,
  Steps,
  Table,
  UL,
} from "@/components/docs/parts";

export const metadata: Metadata = {
  title: "Documentation · ClearBot",
  description:
    "Complete documentation for operators, admins, and developers building on ClearBot.",
};

export default function DocsPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg pt-[104px] md:pt-[120px]">
        <div className="mx-auto w-full max-w-[1280px] px-6">
          <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
            <DocsSidebar />

            <div className="min-w-0 pb-24">
              <header className="pb-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-body">
                  Documentation · v2.14
                </div>
                <h1 className="mt-2 font-display text-[clamp(36px,4.4vw,52px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
                  Everything you need to run ClearBot.
                </h1>
                <p className="mt-4 max-w-[640px] text-[16px] leading-[1.6] text-body">
                  The guides below cover onboarding, day-to-day operations,
                  automation modes, and the REST API. If you can&apos;t find what
                  you need, email{" "}
                  <a
                    href="mailto:support@clearbot.io"
                    className="text-ink underline-offset-2 hover:underline"
                  >
                    support@clearbot.io
                  </a>{" "}
                  — a real person replies within an hour during business days.
                </p>
              </header>

              <article className="docs-prose">
                {/* ————— GETTING STARTED ————— */}
                <H2 id="introduction">Introduction</H2>
                <P>
                  ClearBot is a compliance platform for multi-location
                  operators. It tracks every business license you hold,
                  monitors the issuing agencies for form and fee changes, and
                  files renewals on your behalf. This guide walks you through
                  onboarding, operating the dashboard, and — if you&apos;re a
                  developer — integrating with the API.
                </P>
                <P>
                  If you&apos;re new to ClearBot, we recommend reading this page
                  top to bottom. Each section anchors independently, so you can
                  also jump directly to a topic from the sidebar.
                </P>
                <Callout kind="tip" title="In a hurry?">
                  Go straight to <a href="#first-filing" className="underline">
                    Your first filing
                  </a>{" "}
                  if you have ClearBot access and just need to submit a
                  renewal.
                </Callout>

                <H2 id="how-it-works">How ClearBot works</H2>
                <P>
                  ClearBot runs three systems continuously. Understanding how
                  they fit together makes the rest of the product self-evident.
                </P>
                <H3>1. The license ledger</H3>
                <P>
                  Every license you hold becomes a row in the ledger. Each row
                  is canonicalized against a taxonomy of 1,200+ license types,
                  mapped to its issuing agency, and stamped with a renewal
                  cadence. The ledger is the source of truth — every dashboard
                  view, every alert, and every filing is derived from it.
                </P>
                <H3>2. The agency engine</H3>
                <P>
                  We poll 528 federal, state, county, and municipal portals
                  every 90 seconds. When a form version, fee schedule, or
                  deadline changes, the change is recorded against the
                  affected licenses <em>before</em> your next renewal runs. You
                  never file an outdated form.
                </P>
                <H3>3. The filing pipeline</H3>
                <P>
                  When a renewal approaches, the pipeline prepares the packet,
                  calculates the fee, routes payment, and either hands it to
                  you for review (Prep mode) or files it directly (Auto mode).
                  Every step is audit-logged with an immutable record of what
                  was submitted and when.
                </P>

                <H2 id="onboarding">Onboarding checklist</H2>
                <P>
                  Most operators go from signed contract to fully active in
                  under two weeks. Here&apos;s what you can expect, broken into
                  phases.
                </P>
                <Steps>
                  <Step n={1} title="Intake call (30 min)">
                    A ClearBot compliance manager walks through your portfolio
                    of locations, entities, and existing records. We agree on
                    an automation mode for each license class and confirm
                    payment routing.
                  </Step>
                  <Step n={2} title="Data handoff (2–5 days)">
                    You send us whatever you have: spreadsheets, PDFs,
                    screenshots of a portal. Our team extracts, normalizes,
                    and verifies every entry against the issuing agency.
                    Gaps are flagged in a shared tracker.
                  </Step>
                  <Step n={3} title="Verification (3–7 days)">
                    You review the normalized ledger. ClearBot highlights
                    conflicts — e.g. a license we found at an agency that
                    isn&apos;t in your records, or vice versa. Together we
                    reconcile the differences.
                  </Step>
                  <Step n={4} title="Go live">
                    Monitoring and alerting switch on the moment you approve
                    the ledger. If a renewal is due within 30 days of go-live,
                    the team prioritizes it ahead of the normal pipeline.
                  </Step>
                </Steps>
                <Callout kind="note">
                  The checklist lives in your onboarding tracker. Your
                  compliance manager and your operations lead both have edit
                  access.
                </Callout>

                <H2 id="first-filing">Your first filing</H2>
                <P>
                  Once you&apos;re live, the first renewal usually happens in the
                  first two weeks. Here&apos;s what the flow looks like in Prep
                  mode (the default).
                </P>
                <Steps>
                  <Step n={1} title="Alert">
                    7, 14, and 30 days before the deadline, the primary
                    location manager and the account owner get an email and
                    an in-app notification. Enable Slack/Teams for real-time
                    push.
                  </Step>
                  <Step n={2} title="Prepared packet">
                    ClearBot fills the current form version with data from the
                    ledger. If any field can&apos;t be derived (e.g. updated
                    square footage), the packet pauses with a single clear
                    question.
                  </Step>
                  <Step n={3} title="Fee calculation & payment">
                    The fee is calculated from the agency&apos;s live schedule.
                    Payment is routed from the configured account. You see the
                    exact amount before approving.
                  </Step>
                  <Step n={4} title="Your approval">
                    One click to approve. The pipeline files the form,
                    captures the agency receipt, and stores everything in the
                    document vault.
                  </Step>
                  <Step n={5} title="Confirmation">
                    You receive the receipt and a status update when the
                    agency confirms processing (usually same-day, sometimes
                    up to 5 business days).
                  </Step>
                </Steps>

                {/* ————— CORE CONCEPTS ————— */}
                <H2 id="licenses">Licenses & locations</H2>
                <P>
                  A <Code>license</Code> is any permit, certification, or
                  registration that authorizes a business activity. Every
                  license is attached to exactly one <Code>location</Code> or
                  one <Code>legal entity</Code>. This separation matters: a
                  multi-location operator often has entity-level licenses (e.g.
                  a state-wide alcohol license) plus many location-level ones
                  (e.g. a per-storefront health permit).
                </P>
                <Table
                  cols={["Field", "Type", "Notes"]}
                  rows={[
                    ["license_id", "uuid", "Stable across renewals"],
                    ["license_type", "text", "Canonical, from the taxonomy"],
                    ["jurisdiction", "text", "Federal · state · county · city"],
                    ["agency_code", "text", "ISO-style normalized"],
                    ["issued_at", "date", "First-issue date"],
                    ["expires_at", "date", "Next renewal deadline"],
                    ["status", "enum", "active · pending · revoked · lapsed"],
                    ["location_id", "uuid?", "Nullable for entity-level licenses"],
                  ]}
                />

                <H2 id="cadences">Renewal cadences</H2>
                <P>
                  Every license type has a default renewal cadence. You can
                  override it per-license (for unusual cases) and ClearBot will
                  respect the override. Cadences can be:
                </P>
                <UL>
                  <LI>
                    <strong>Fixed date</strong> — e.g. &ldquo;every December 31&rdquo;.
                    Alerts start 45 days prior by default.
                  </LI>
                  <LI>
                    <strong>Rolling from issue</strong> — e.g. &ldquo;every 12
                    months from the issue date&rdquo;.
                  </LI>
                  <LI>
                    <strong>Biennial</strong> / <strong>triennial</strong> —
                    longer cadences with multi-year holds.
                  </LI>
                  <LI>
                    <strong>On demand</strong> — licenses that don&apos;t renew but
                    require periodic re-inspection or continuing-education
                    filings.
                  </LI>
                </UL>

                <H2 id="automation">Automation modes</H2>
                <P>
                  Automation mode is set per-license-class. You can run
                  different classes at different levels, and you can change a
                  mode at any time without losing data.
                </P>
                <Table
                  cols={["Mode", "What ClearBot does", "What you do"]}
                  rows={[
                    [
                      "Alert",
                      "Track deadlines; send alerts",
                      "Prepare and submit the filing yourself",
                    ],
                    [
                      "Prep",
                      "Fill forms, calculate fees, stage payments",
                      "Review and approve; ClearBot files",
                    ],
                    [
                      "Auto",
                      "Everything end-to-end, including submission",
                      "Receive same-day confirmation",
                    ],
                  ]}
                />
                <Callout kind="warn">
                  Some agency forms require a wet signature or in-person
                  notarization. Those licenses cannot run in Auto mode and will
                  fall back to Prep automatically.
                </Callout>

                <H2 id="audit">Audit trail</H2>
                <P>
                  Every read, every write, every filing is logged to an
                  append-only audit log. Entries are immutable and include the
                  actor, timestamp, role-in-effect, affected resource, and a
                  diff of the change (for writes).
                </P>
                <P>
                  The log is queryable from the dashboard, exportable as CSV
                  for legal review, and streamable via the Webhooks API to
                  your SIEM.
                </P>

                {/* ————— OPERATING ————— */}
                <H2 id="calendar">Renewal calendar</H2>
                <P>
                  The calendar view in the dashboard shows every upcoming
                  renewal across every location. You can filter by:
                </P>
                <UL>
                  <LI>Location, jurisdiction, license class, or manager</LI>
                  <LI>Status (due, overdue, filed, current)</LI>
                  <LI>Automation mode</LI>
                </UL>
                <P>
                  The same view is available as a personalized ICS feed so you
                  can subscribe from Google Calendar, Apple Calendar, or
                  Outlook. Generate a feed URL in <strong>Settings →
                  Integrations → Calendar feeds</strong>.
                </P>

                <H2 id="pipeline">Filing pipeline</H2>
                <P>
                  The pipeline has five stages. You can observe them in real
                  time on the &ldquo;Filings in flight&rdquo; panel.
                </P>
                <Table
                  cols={["Stage", "Typical duration", "What happens"]}
                  rows={[
                    ["Prepared", "instant", "Form filled from ledger data"],
                    ["Awaiting approval", "operator-dependent", "Only in Prep mode"],
                    ["Submitting", "2–30s", "Upload to agency portal"],
                    ["Accepted", "same-day to 5 days", "Agency confirms receipt"],
                    ["Complete", "varies", "Certificate issued"],
                  ]}
                />
                <P>
                  Each stage records its own audit entries. If a filing is
                  rejected, the rejection reason is parsed from the agency
                  response (where possible) and surfaced inline, with a
                  suggested correction.
                </P>

                <H2 id="documents">Documents & receipts</H2>
                <P>
                  Every document we see or file — the form submitted, the
                  agency receipt, subsequent correspondence, and the issued
                  certificate — is stored in the per-tenant document vault.
                </P>
                <UL>
                  <LI>Encrypted at rest with AES-256, isolated per tenant.</LI>
                  <LI>Downloadable individually or in bulk (max 500 per zip).</LI>
                  <LI>
                    Optional PII redaction for legal export (SSN, EIN, bank
                    routing numbers, signatures).
                  </LI>
                  <LI>
                    Lifecycle policy: originals retained for seven years by
                    default; configurable per tenant.
                  </LI>
                </UL>

                <H2 id="team">Team & permissions</H2>
                <P>
                  ClearBot ships four built-in roles. Any role can be extended
                  or replaced with a custom one in <strong>Settings →
                  Roles</strong>.
                </P>
                <Table
                  cols={["Role", "Licenses", "Filings", "Payments", "Audit log"]}
                  rows={[
                    ["Operator", "Read", "Approve (own loc.)", "—", "Read (own)"],
                    ["Manager", "Read/write (own)", "Approve (own)", "Read", "Read (own)"],
                    ["Finance", "Read", "Read", "Read/write", "Read"],
                    ["Legal", "Read", "Read", "Read", "Read/export"],
                  ]}
                />
                <Callout kind="tip" title="Custom roles">
                  Custom roles let you mix scopes — e.g. a read-only regional
                  VP, or a payments-only bookkeeper. See <a
                    href="#api-auth"
                    className="underline"
                  >
                    API auth
                  </a>{" "}
                  for programmatic provisioning.
                </Callout>

                {/* ————— API ————— */}
                <H2 id="api-auth">API authentication</H2>
                <P>
                  All API requests authenticate with a bearer token. Generate
                  a token in <strong>Settings → API keys</strong>. Tokens are
                  scoped to a role and optionally to a set of locations.
                </P>
                <Pre language="shell">{`curl https://api.clearbot.io/v1/licenses \\
  -H "Authorization: Bearer \${CB_API_KEY}" \\
  -H "Accept: application/json"`}</Pre>
                <P>
                  The base URL is <Code>https://api.clearbot.io/v1</Code>. All
                  endpoints speak JSON; requests and responses are UTF-8.
                </P>
                <Callout kind="warn">
                  Never commit tokens to source control. We rotate any token
                  automatically if we detect it on a public code host.
                </Callout>

                <H2 id="api-licenses">Licenses endpoint</H2>
                <P>
                  List licenses, filter by jurisdiction, and inspect the full
                  history of any row.
                </P>
                <H3 id="api-licenses-list">List licenses</H3>
                <Pre language="shell">{`GET /v1/licenses?location_id=loc_123&status=active

{
  "data": [
    {
      "id": "lic_7f9c",
      "license_type": "retail_liquor_onpremise",
      "jurisdiction": "IL:Cook:Chicago",
      "agency_code": "IL-LCC",
      "expires_at": "2026-12-31",
      "status": "active",
      "automation_mode": "prep",
      "location_id": "loc_123"
    }
  ],
  "cursor": null
}`}</Pre>

                <H3 id="api-licenses-create">Create a license</H3>
                <Pre language="shell">{`POST /v1/licenses
Content-Type: application/json

{
  "license_type": "food_service_cert",
  "location_id": "loc_123",
  "issued_at": "2026-01-15",
  "expires_at": "2027-01-14",
  "automation_mode": "auto"
}`}</Pre>
                <P>
                  We normalize <Code>license_type</Code> against the taxonomy
                  on write. Unknown types return <Code>422</Code> with a list
                  of close matches; ambiguous types pause the request for
                  operator review.
                </P>

                <H2 id="api-filings">Filings endpoint</H2>
                <P>
                  Inspect filings in flight, trigger a manual filing, or
                  retrieve a historical submission.
                </P>
                <Pre language="shell">{`GET /v1/filings?status=in_flight

{
  "data": [
    {
      "id": "fil_a4d2",
      "license_id": "lic_7f9c",
      "stage": "submitting",
      "attempt": 1,
      "started_at": "2026-04-22T18:11:04Z",
      "eta_seconds": 8
    }
  ]
}`}</Pre>

                <H2 id="api-webhooks">Webhooks</H2>
                <P>
                  Subscribe to events to power your own automation. Every
                  webhook is signed with an HMAC-SHA256 signature in the{" "}
                  <Code>X-ClearBot-Signature</Code> header.
                </P>
                <Table
                  cols={["Event", "When it fires"]}
                  rows={[
                    ["license.created", "A new license is added to the ledger"],
                    ["license.due", "A license enters the due window (default 30d)"],
                    ["filing.submitted", "A filing was sent to the agency"],
                    ["filing.accepted", "The agency confirmed receipt"],
                    ["filing.rejected", "The agency rejected the filing (with reason)"],
                    ["incident.opened", "Status page: a new incident is opened"],
                  ]}
                />
                <Pre language="node">{`import crypto from "node:crypto";

export function verify(body: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}`}</Pre>

                <H2 id="api-limits">Rate limits</H2>
                <P>
                  Default rate limits are generous; contact us if you need
                  more. Each response includes the current usage in headers.
                </P>
                <Table
                  cols={["Scope", "Limit", "Window"]}
                  rows={[
                    ["Read (GET)", "600 req/min", "rolling 60s"],
                    ["Write (POST/PATCH)", "120 req/min", "rolling 60s"],
                    ["Bulk export", "6 req/min", "rolling 60s"],
                    ["Webhook deliveries", "2k req/min", "per endpoint"],
                  ]}
                />
                <Pre language="http">{`HTTP/1.1 200 OK
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 587
X-RateLimit-Reset: 1719420032`}</Pre>

                {/* ————— INTEGRATIONS ————— */}
                <H2 id="int-chat">Slack & Teams</H2>
                <P>
                  Install from <strong>Settings → Integrations</strong>. Once
                  connected, choose which channels receive which event
                  categories (alerts, confirmations, incidents, or all).
                </P>
                <UL>
                  <LI>Slash commands: <Code>/clearbot renewals</Code>, <Code>/clearbot due</Code></LI>
                  <LI>Per-channel routing by jurisdiction or manager</LI>
                  <LI>Thread replies to include the operator who approved a filing</LI>
                </UL>

                <H2 id="int-sso">SSO (SAML + SCIM)</H2>
                <P>
                  On Standard and Professional plans, configure SAML 2.0 for
                  any IdP (Okta, Entra, Google Workspace, JumpCloud, custom).
                  SCIM is supported for provisioning and role assignment.
                </P>
                <Steps>
                  <Step n={1} title="Create the SAML app in your IdP">
                    Use the ACS URL shown in <strong>Settings → SSO</strong>.
                  </Step>
                  <Step n={2} title="Upload your IdP metadata">
                    Either upload the XML directly, or paste the metadata URL
                    for auto-refresh.
                  </Step>
                  <Step n={3} title="Map attributes">
                    At minimum, map <Code>email</Code>, <Code>given_name</Code>,
                    and <Code>role</Code>. Additional attributes can be mapped
                    to custom user fields.
                  </Step>
                  <Step n={4} title="Enforce SSO-only">
                    Once verified, toggle SSO-only on your tenant. Bearer
                    tokens still work for API access.
                  </Step>
                </Steps>

                <H2 id="int-zapier">Zapier & Make</H2>
                <P>
                  ClearBot has public apps on both platforms. Install via the
                  Zapier or Make directory — OAuth-based, no token management
                  required.
                </P>
                <UL>
                  <LI>
                    <strong>Triggers:</strong> new license, due renewal, filing
                    submitted, filing accepted, filing rejected, incident
                    opened, audit event, document uploaded
                  </LI>
                  <LI>
                    <strong>Actions:</strong> add license, update automation
                    mode, add note, create custom alert, export audit slice
                  </LI>
                </UL>

                {/* ————— HELP ————— */}
                <H2 id="troubleshooting">Troubleshooting</H2>
                <H3>A renewal alert is missing</H3>
                <P>
                  Make sure the license has a populated <Code>expires_at</Code>.
                  If the license is marked <Code>pending</Code> or the
                  automation mode is <Code>off</Code>, no alert fires.
                </P>
                <H3>A filing was rejected</H3>
                <P>
                  The rejection reason is visible on the filing detail page.
                  For common reasons (data mismatch, fee change, missing
                  attachment), ClearBot suggests an inline correction. For
                  others, escalate to your compliance manager.
                </P>
                <H3>SSO login loops</H3>
                <P>
                  Nine times out of ten this is a clock-skew issue on the IdP.
                  Re-sync your IdP&apos;s NTP and try again. If that doesn&apos;t
                  help, check that the <Code>email</Code> attribute is
                  populated in the SAML response.
                </P>

                <H2 id="faq">FAQ</H2>
                <H3>Can I export all my data if I cancel?</H3>
                <P>
                  Yes. We export the full ledger as CSV, the full filing
                  history as CSV, and every document as PDF into a zip. No
                  egress fees.
                </P>
                <H3>Do you support wet signatures?</H3>
                <P>
                  For agencies that require them, yes — we mail the prepared
                  packet to your office with the signature block flagged, and
                  provide a pre-paid return envelope to the agency.
                </P>
                <H3>How quickly do you add new agencies?</H3>
                <P>
                  New federal and state agencies are added within two weeks of
                  customer request. County and municipal agencies take 3–6
                  weeks depending on portal complexity.
                </P>

                <H2 id="support">Support</H2>
                <P>
                  Every plan includes email support at{" "}
                  <a
                    href="mailto:support@clearbot.io"
                    className="text-ink underline-offset-2 hover:underline"
                  >
                    support@clearbot.io
                  </a>
                  . Standard and Professional include a Slack Connect channel
                  with your compliance manager.
                </P>
                <UL>
                  <LI>
                    <strong>SLA (Professional):</strong> 1-hour initial response
                    during business days, 4-hour off-hours for incidents.
                  </LI>
                  <LI>
                    <strong>Incidents:</strong> see{" "}
                    <Link
                      href="/status"
                      className="text-ink underline-offset-2 hover:underline"
                    >
                      status.clearbot.io
                    </Link>{" "}
                    for real-time health and history.
                  </LI>
                  <LI>
                    <strong>Changelog:</strong> every release is listed at{" "}
                    <Link
                      href="/changelog"
                      className="text-ink underline-offset-2 hover:underline"
                    >
                      /changelog
                    </Link>
                    .
                  </LI>
                </UL>
              </article>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
