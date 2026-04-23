export type DocItem = { label: string; href: string };
export type DocSection = { title: string; items: DocItem[] };

export const DOC_SECTIONS: DocSection[] = [
  {
    title: "Getting started",
    items: [
      { label: "Introduction", href: "#introduction" },
      { label: "How ClearBot works", href: "#how-it-works" },
      { label: "Onboarding checklist", href: "#onboarding" },
      { label: "Your first filing", href: "#first-filing" },
    ],
  },
  {
    title: "Core concepts",
    items: [
      { label: "Licenses & locations", href: "#licenses" },
      { label: "Renewal cadences", href: "#cadences" },
      { label: "Automation modes", href: "#automation" },
      { label: "Audit trail", href: "#audit" },
    ],
  },
  {
    title: "Operating",
    items: [
      { label: "Renewal calendar", href: "#calendar" },
      { label: "Filing pipeline", href: "#pipeline" },
      { label: "Documents & receipts", href: "#documents" },
      { label: "Team & permissions", href: "#team" },
    ],
  },
  {
    title: "API reference",
    items: [
      { label: "Authentication", href: "#api-auth" },
      { label: "Licenses endpoint", href: "#api-licenses" },
      { label: "Filings endpoint", href: "#api-filings" },
      { label: "Webhooks", href: "#api-webhooks" },
      { label: "Rate limits", href: "#api-limits" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Slack & Teams", href: "#int-chat" },
      { label: "SSO (SAML + SCIM)", href: "#int-sso" },
      { label: "Zapier & Make", href: "#int-zapier" },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Troubleshooting", href: "#troubleshooting" },
      { label: "FAQ", href: "#faq" },
      { label: "Support", href: "#support" },
    ],
  },
];
