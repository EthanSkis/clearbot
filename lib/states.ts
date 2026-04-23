export type StateInfo = {
  code: string;
  name: string;
  col: number;
  row: number;
  covered: boolean;
  agencies?: number;
  licenses?: number;
  topLicense?: string;
  notes?: string;
};

// 12-col x 8-row tile grid. Hand-tuned for clarity over strict accuracy.
export const STATES: StateInfo[] = [
  { code: "ME", name: "Maine", col: 11, row: 0, covered: true, agencies: 6, licenses: 142, topLicense: "Lobster dealer permit" },
  { code: "VT", name: "Vermont", col: 10, row: 1, covered: true, agencies: 5, licenses: 88, topLicense: "Liquor license (Class 1)" },
  { code: "NH", name: "New Hampshire", col: 11, row: 1, covered: true, agencies: 5, licenses: 104, topLicense: "Health permit" },
  { code: "WA", name: "Washington", col: 1, row: 2, covered: true, agencies: 11, licenses: 612, topLicense: "WA Liquor & Cannabis Board" },
  { code: "ID", name: "Idaho", col: 2, row: 2, covered: true, agencies: 6, licenses: 198, topLicense: "ITD freight permit" },
  { code: "MT", name: "Montana", col: 3, row: 2, covered: false, notes: "Coming Q3 2026" },
  { code: "ND", name: "North Dakota", col: 4, row: 2, covered: false, notes: "Coming Q3 2026" },
  { code: "MN", name: "Minnesota", col: 5, row: 2, covered: true, agencies: 9, licenses: 384, topLicense: "Food handler license" },
  { code: "WI", name: "Wisconsin", col: 6, row: 2, covered: true, agencies: 8, licenses: 296, topLicense: "Class B liquor license" },
  { code: "MI", name: "Michigan", col: 7, row: 2, covered: true, agencies: 12, licenses: 471, topLicense: "MLCC retailer license" },
  { code: "NY", name: "New York", col: 9, row: 2, covered: true, agencies: 18, licenses: 1284, topLicense: "NYC DOH food service" },
  { code: "MA", name: "Massachusetts", col: 10, row: 2, covered: true, agencies: 11, licenses: 432, topLicense: "ABCC pouring license" },
  { code: "RI", name: "Rhode Island", col: 11, row: 2, covered: true, agencies: 4, licenses: 76, topLicense: "Class BV liquor license" },
  { code: "OR", name: "Oregon", col: 1, row: 3, covered: true, agencies: 8, licenses: 287, topLicense: "OLCC full on-premises" },
  { code: "NV", name: "Nevada", col: 2, row: 3, covered: true, agencies: 7, licenses: 218, topLicense: "Clark County liquor" },
  { code: "WY", name: "Wyoming", col: 3, row: 3, covered: false, notes: "Low operator volume" },
  { code: "SD", name: "South Dakota", col: 4, row: 3, covered: false, notes: "Coming Q3 2026" },
  { code: "IA", name: "Iowa", col: 5, row: 3, covered: true, agencies: 7, licenses: 211, topLicense: "ABD class C beer" },
  { code: "IL", name: "Illinois", col: 6, row: 3, covered: true, agencies: 14, licenses: 982, topLicense: "Cook County health" },
  { code: "IN", name: "Indiana", col: 7, row: 3, covered: true, agencies: 9, licenses: 311, topLicense: "ATC retailer permit" },
  { code: "OH", name: "Ohio", col: 8, row: 3, covered: true, agencies: 13, licenses: 644, topLicense: "Liquor permit D-5" },
  { code: "PA", name: "Pennsylvania", col: 9, row: 3, covered: true, agencies: 15, licenses: 856, topLicense: "PLCB restaurant license" },
  { code: "NJ", name: "New Jersey", col: 10, row: 3, covered: true, agencies: 12, licenses: 498, topLicense: "ABC plenary retail" },
  { code: "CT", name: "Connecticut", col: 11, row: 3, covered: true, agencies: 8, licenses: 233, topLicense: "DCP café liquor permit" },
  { code: "CA", name: "California", col: 1, row: 4, covered: true, agencies: 22, licenses: 2147, topLicense: "ABC Type 47" },
  { code: "UT", name: "Utah", col: 2, row: 4, covered: true, agencies: 6, licenses: 158, topLicense: "DABC restaurant license" },
  { code: "CO", name: "Colorado", col: 3, row: 4, covered: true, agencies: 10, licenses: 412, topLicense: "Hotel & restaurant liquor" },
  { code: "NE", name: "Nebraska", col: 4, row: 4, covered: false, notes: "Coming Q3 2026" },
  { code: "MO", name: "Missouri", col: 5, row: 4, covered: true, agencies: 9, licenses: 318, topLicense: "ATC by-the-drink license" },
  { code: "KY", name: "Kentucky", col: 6, row: 4, covered: true, agencies: 7, licenses: 224, topLicense: "ABC quota retail" },
  { code: "WV", name: "West Virginia", col: 7, row: 4, covered: false, notes: "Coming Q4 2026" },
  { code: "VA", name: "Virginia", col: 8, row: 4, covered: true, agencies: 11, licenses: 387, topLicense: "ABC mixed beverage" },
  { code: "MD", name: "Maryland", col: 9, row: 4, covered: true, agencies: 10, licenses: 312, topLicense: "Class B beer/wine/liquor" },
  { code: "DE", name: "Delaware", col: 10, row: 4, covered: true, agencies: 4, licenses: 79, topLicense: "OABCC restaurant" },
  { code: "AZ", name: "Arizona", col: 2, row: 5, covered: true, agencies: 8, licenses: 366, topLicense: "Series 12 restaurant" },
  { code: "NM", name: "New Mexico", col: 3, row: 5, covered: false, notes: "Coming Q4 2026" },
  { code: "KS", name: "Kansas", col: 4, row: 5, covered: true, agencies: 6, licenses: 184, topLicense: "ABC drinking establishment" },
  { code: "AR", name: "Arkansas", col: 5, row: 5, covered: false, notes: "Coming Q4 2026" },
  { code: "TN", name: "Tennessee", col: 6, row: 5, covered: true, agencies: 9, licenses: 348, topLicense: "TABC on-premise consumption" },
  { code: "NC", name: "North Carolina", col: 7, row: 5, covered: true, agencies: 11, licenses: 526, topLicense: "ABC mixed beverage" },
  { code: "SC", name: "South Carolina", col: 8, row: 5, covered: true, agencies: 7, licenses: 241, topLicense: "DOR liquor license" },
  { code: "AK", name: "Alaska", col: 0, row: 6, covered: false, notes: "Special filings on request" },
  { code: "OK", name: "Oklahoma", col: 4, row: 6, covered: false, notes: "Coming Q4 2026" },
  { code: "LA", name: "Louisiana", col: 5, row: 6, covered: true, agencies: 8, licenses: 281, topLicense: "ATC Class A retail" },
  { code: "MS", name: "Mississippi", col: 6, row: 6, covered: false, notes: "Coming Q4 2026" },
  { code: "AL", name: "Alabama", col: 7, row: 6, covered: true, agencies: 6, licenses: 197, topLicense: "ABC retail liquor" },
  { code: "GA", name: "Georgia", col: 8, row: 6, covered: true, agencies: 10, licenses: 423, topLicense: "DOR alcohol license" },
  { code: "HI", name: "Hawaii", col: 0, row: 7, covered: false, notes: "Special filings on request" },
  { code: "TX", name: "Texas", col: 4, row: 7, covered: true, agencies: 16, licenses: 1418, topLicense: "TABC mixed beverage permit" },
  { code: "FL", name: "Florida", col: 8, row: 7, covered: true, agencies: 14, licenses: 1106, topLicense: "DBPR 4COP quota license" },
];

export const COVERED_COUNT = STATES.filter((s) => s.covered).length;
export const TOTAL_AGENCIES = STATES.reduce((n, s) => n + (s.agencies ?? 0), 0);
export const TOTAL_LICENSES = STATES.reduce((n, s) => n + (s.licenses ?? 0), 0);
