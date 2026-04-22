export const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "Coverage", href: "#coverage" },
  { label: "Data", href: "#data" },
];

export type LicenseStatus = "current" | "due" | "overdue";

export type LicenseRow = {
  id: string;
  type: string;
  location: string;
  daysRemaining: number;
  cycleDays: number;
};

export const SEED_ROWS: LicenseRow[] = [
  {
    id: "r1",
    type: "Liquor License",
    location: "Chicago, IL",
    daysRemaining: 4,
    cycleDays: 365,
  },
  {
    id: "r2",
    type: "Health Permit",
    location: "Austin, TX",
    daysRemaining: 18,
    cycleDays: 365,
  },
  {
    id: "r3",
    type: "Sales Tax Permit",
    location: "Brooklyn, NY",
    daysRemaining: 92,
    cycleDays: 365,
  },
  {
    id: "r4",
    type: "Food Service Cert",
    location: "Los Angeles, CA",
    daysRemaining: 247,
    cycleDays: 365,
  },
  {
    id: "r5",
    type: "Tobacco Retailer",
    location: "Miami, FL",
    daysRemaining: 31,
    cycleDays: 365,
  },
  {
    id: "r6",
    type: "Building Occupancy",
    location: "Denver, CO",
    daysRemaining: 0,
    cycleDays: 365,
  },
];

export function statusFor(days: number): LicenseStatus {
  if (days <= 0) return "overdue";
  if (days <= 30) return "due";
  return "current";
}

export const TRUST_COMPANIES = [
  "Meridian Restaurant Group",
  "Coastal Franchise Partners",
  "Summit Healthcare Ops",
  "Westfield Hospitality",
  "Anchor Retail Holdings",
  "Beacon Logistics Co.",
];

export const FEAR_FACTS = [
  {
    region: "California",
    body: "A lapsed liquor license triggers mandatory full re-application. The process takes 12–18 months. Operations halt the day the license expires.",
  },
  {
    region: "Texas",
    body: "Missed renewals accrue $500 per day in fines with no cap and no grace period after the 30-day window closes.",
  },
  {
    region: "Illinois",
    body: "A lapsed health department certificate triggers immediate forced closure pending re-inspection — typically 3 to 6 weeks.",
  },
];

export const FOUR_STEPS = [
  {
    n: "01",
    title: "Onboard",
    body: "Send us your locations and existing license records, however messy. We extract, normalize, and verify every renewal date.",
  },
  {
    n: "02",
    title: "Map",
    body: "Every license is mapped to its issuing agency, form, fee, and renewal cadence — across all 38 supported states.",
  },
  {
    n: "03",
    title: "Track",
    body: "ClearBot watches every deadline. You see one dashboard. Owners and managers get the alerts that matter to their location.",
  },
  {
    n: "04",
    title: "File",
    body: "Forms are pre-filled, fees calculated, payments routed, and submissions logged. You approve. ClearBot files.",
  },
];

export const AGENCIES = [
  { code: "TX TABC", name: "Texas Alcoholic Beverage Commission" },
  { code: "CA ABC", name: "California Dept. of Alcoholic Beverage Control" },
  { code: "IL IDPH", name: "Illinois Dept. of Public Health" },
  { code: "NYC DOH", name: "NYC Dept. of Health & Mental Hygiene" },
  { code: "FL DBPR", name: "Florida Dept. of Business & Professional Regulation" },
  { code: "CO DOR", name: "Colorado Dept. of Revenue" },
  { code: "GA DOR", name: "Georgia Dept. of Revenue" },
  { code: "WA LCB", name: "Washington Liquor & Cannabis Board" },
];

export const AUTOMATION_MODES = [
  {
    n: "01",
    name: "Alert",
    body: "We track. You get notified, well in advance, with everything needed to act. You file yourselves.",
  },
  {
    n: "02",
    name: "Prep",
    body: "We track and prepare. Forms are pre-filled, fees calculated, payments staged. You review and submit.",
  },
  {
    n: "03",
    name: "Auto",
    body: "We track, prepare, and file. Submissions go out automatically. You see confirmations the same day.",
  },
];

export const PRICING_TIERS = [
  {
    tier: "Essential",
    price: 500,
    description: "Tracking and alerts. We watch every deadline, you file.",
    features: [
      "Every license, every location",
      "Real-time agency monitoring",
      "Manager-level alerts",
      "Renewal calendar export",
      "Email + SMS notifications",
    ],
    cta: "Start with Essential",
  },
  {
    tier: "Standard",
    price: 800,
    featured: true,
    description: "Everything in Essential, plus pre-filled forms and prepared filings.",
    features: [
      "Pre-filled renewal packets",
      "Fee calculation & payment routing",
      "Approval workflows",
      "Document storage & history",
      "Quarterly compliance reports",
    ],
    cta: "Start with Standard",
  },
  {
    tier: "Professional",
    price: 1200,
    description: "Fully automated filing. Submissions go out without you lifting a finger.",
    features: [
      "Automated submission to agencies",
      "Same-day confirmation receipts",
      "Dedicated compliance manager",
      "Custom integrations & SSO",
      "Priority response, 1-hour SLA",
    ],
    cta: "Talk to us about Professional",
  },
];

export const QUOTES = [
  {
    body: "We had a Filemaker spreadsheet, two ops people, and a prayer. Now we have ClearBot. The prayer was the weakest link.",
    name: "Diana Reyes",
    role: "Director of Operations",
    company: "Meridian Restaurant Group",
    locations: "62 locations",
  },
  {
    body: "It paid for itself the first month. One lapsed health permit in Cook County would have cost us six figures and a closed location.",
    name: "Marcus Holt",
    role: "COO",
    company: "Coastal Franchise Partners",
    locations: "118 locations",
  },
  {
    body: "I stopped checking my email at 6am to see if a renewal slipped. That alone is worth the contract.",
    name: "Priya Anand",
    role: "VP, Operations",
    company: "Summit Healthcare Ops",
    locations: "47 locations",
  },
  {
    body: "The audit trail is the part nobody talks about. Every form, every submission, every confirmation. Lawyers love it.",
    name: "Jonathan Pak",
    role: "General Counsel",
    company: "Westfield Hospitality",
    locations: "33 locations",
  },
  {
    body: "Onboarding took a week. Eight years of license records, sorted and verified. We thought it would take six months.",
    name: "Erica Walsh",
    role: "Owner",
    company: "Anchor Retail Holdings",
    locations: "21 locations",
  },
  {
    body: "Texas is brutal. ClearBot just handles it. I haven’t looked at a TABC form in fourteen months.",
    name: "Rafael Quintero",
    role: "Regional Manager",
    company: "Beacon Logistics Co.",
    locations: "29 locations",
  },
];

export const DATA_BUYERS = [
  {
    buyer: "Private equity diligence teams",
    note: "Jurisdiction-by-jurisdiction license risk for any target.",
    anchor: "$25k / engagement",
  },
  {
    buyer: "Insurance underwriters",
    note: "Live compliance feed for risk-rated locations.",
    anchor: "$80k / yr",
  },
  {
    buyer: "Multi-state expansion teams",
    note: "Forecast renewal load and agency lead times before signing leases.",
    anchor: "$15k / market study",
  },
  {
    buyer: "Compliance research firms",
    note: "API access to the full agency knowledge base.",
    anchor: "Custom",
  },
];

export const FINAL_CTA_BULLETS = [
  "A live audit of your current license inventory.",
  "A risk map of your top three exposed locations.",
  "A 30-second demo of what handoff to ClearBot looks like.",
];
