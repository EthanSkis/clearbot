export type EntryTag = "feature" | "improvement" | "fix" | "agency" | "security";

export type ChangelogEntry = {
  id: string;
  date: string;
  title: string;
  tags: EntryTag[];
  summary: string;
  bullets: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-04-18",
    date: "2026-04-18",
    title: "License inventory filtering + CSV export",
    tags: ["feature"],
    summary:
      "The main dashboard inventory now filters by status (All / Needs attention / Filed) with an inline location search and CSV export of the current view.",
    bullets: [
      "Three-way status tab filter replaces the old static counts.",
      "Toolbar Filter button opens a location & license-type search.",
      "Export button downloads a CSV named by filter and date.",
      "Keyboard: / focuses search when the Filter panel is open.",
    ],
  },
  {
    id: "2026-04-10",
    date: "2026-04-10",
    title: "9 new municipal portals — Georgia + South Carolina",
    tags: ["agency"],
    summary:
      "Added automated filing for 9 city and county portals across GA and SC, bringing total supported portals to 528.",
    bullets: [
      "Fulton County (GA) — business license renewal",
      "DeKalb County (GA) — food service certification",
      "City of Atlanta — alcohol license renewal (2 forms)",
      "Charleston County (SC) — business license",
      "City of Charleston — hospitality tax registration",
      "Richland County (SC) — retail license",
      "Greenville County (SC) — business license",
      "Beaufort County (SC) — business license",
    ],
  },
  {
    id: "2026-04-06",
    date: "2026-04-06",
    title: "Filing pipeline v2.14 — improved retry semantics",
    tags: ["improvement"],
    summary:
      "The filing pipeline now uses exponential backoff with jitter for agency uploads, and differentiates transient errors from permanent rejections.",
    bullets: [
      "Transient 5xx responses retry up to 6 times over 45 minutes.",
      "Permanent 4xx (validation) errors surface immediately to the operator.",
      "Form-correction suggestions appear inline when a rejection includes a reason code.",
      "Average filing completion time dropped from 8.2s to 5.4s.",
    ],
  },
  {
    id: "2026-03-30",
    date: "2026-03-30",
    title: "Team roles & granular permissions",
    tags: ["feature", "security"],
    summary:
      "Introduced four built-in roles (Operator, Manager, Finance, Legal) and a custom role builder with per-resource permissions.",
    bullets: [
      "Custom roles support read/write/approve scopes on licenses, filings, payments, and audit logs.",
      "SCIM provisioning now respects role assignments from your IdP.",
      "Audit-log entries record the role in effect at time of action.",
      "Role changes require re-authentication for sensitive scopes.",
    ],
  },
  {
    id: "2026-03-22",
    date: "2026-03-22",
    title: "SMS delivery fixes + SendGrid fallback",
    tags: ["fix"],
    summary:
      "Resolved intermittent SMS delivery delays observed on 3/22 and added a secondary delivery route for email notifications.",
    bullets: [
      "Twilio carrier delays no longer block alerting — we now fail over to a secondary SMS provider after 60s.",
      "Email notifications now route through SendGrid as a backup to Postmark.",
      "Delivery receipts are reconciled across providers in the audit log.",
    ],
  },
  {
    id: "2026-03-14",
    date: "2026-03-14",
    title: "Renewal calendar export — ICS feed per manager",
    tags: ["feature"],
    summary:
      "Each operator can now subscribe to a personalized ICS calendar feed filtered to the locations they manage.",
    bullets: [
      "Feeds refresh every 15 minutes.",
      "Revocable tokens — reset from Settings → Integrations.",
      "Optional reminder offsets: 30d, 14d, 7d, 3d, 1d before deadline.",
    ],
  },
  {
    id: "2026-03-02",
    date: "2026-03-02",
    title: "Document storage — bulk download & redaction",
    tags: ["feature"],
    summary:
      "Bulk-download up to 500 documents at once as a zip, with optional automatic PII redaction for legal review.",
    bullets: [
      "Automatic redaction of SSN, EIN, bank routing numbers, and signatures.",
      "Manifest CSV listing every document in the zip with metadata.",
      "Redaction applies at export time — originals are never modified.",
    ],
  },
  {
    id: "2026-02-21",
    date: "2026-02-21",
    title: "Zapier + Make integrations",
    tags: ["feature"],
    summary:
      "Public Zapier and Make apps now available. Trigger workflows from renewal events, filing status changes, and audit events.",
    bullets: [
      "8 triggers, 5 actions.",
      "OAuth-based install — no API tokens to manage.",
      "Rate limits: 600 events/min per connected account.",
    ],
  },
  {
    id: "2026-02-11",
    date: "2026-02-11",
    title: "Dashboard latency fix + read replica autoscaler",
    tags: ["fix", "improvement"],
    summary:
      "After the 2/11 latency incident, we added an autoscaler to the renewals read replica pool and reworked the hot-path query for the operator dashboard.",
    bullets: [
      "p95 dashboard load time back to ~110ms.",
      "Replica pool scales from 3 to 12 based on connection count.",
      "Added a playbook for future hot-partition failovers.",
    ],
  },
  {
    id: "2026-01-28",
    date: "2026-01-28",
    title: "Onboarding — bulk license import from spreadsheet",
    tags: ["feature"],
    summary:
      "New operators can now upload their existing license spreadsheet and have ClearBot extract, normalize, and verify every entry automatically.",
    bullets: [
      "Supports CSV, XLSX, and Google Sheets.",
      "Column mapping UI with fuzzy matching for common field names.",
      "Verification report highlights entries that need operator review.",
    ],
  },
  {
    id: "2026-01-15",
    date: "2026-01-15",
    title: "SOC 2 Type II report — 2025 audit complete",
    tags: ["security"],
    summary:
      "Our 2025 SOC 2 Type II audit is complete with zero exceptions. Customers can request the report under NDA from security@clearbot.io.",
    bullets: [
      "Covers all Trust Service Criteria: Security, Availability, Confidentiality, Processing Integrity.",
      "Audit period: Jan 1 – Dec 31, 2025.",
      "Report available in both PDF and structured JSON format.",
    ],
  },
  {
    id: "2026-01-06",
    date: "2026-01-06",
    title: "California ABC — new form version support",
    tags: ["agency"],
    summary:
      "California Department of Alcoholic Beverage Control rolled out form 8500-A (2026) — ClearBot supports it on day one.",
    bullets: [
      "Automatic migration for all CA liquor renewals.",
      "Fee schedule updated to 2026 rates.",
      "Back-compat with form 8500 (2024) until CA sunsets it.",
    ],
  },
];
