import type { Metadata } from "next";
import { AgencyMonitorMockup } from "@/components/mockups/AgencyMonitorMockup";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RenewalCalendar } from "@/components/dashboard/RenewalCalendar";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AutomationModePanel } from "@/components/dashboard/AutomationModePanel";
import { TeamPanel } from "@/components/dashboard/TeamPanel";
import { IntegrationsPanel } from "@/components/dashboard/IntegrationsPanel";
import { AgencyCoverageStrip } from "@/components/dashboard/AgencyCoverageStrip";
import { JurisdictionBreakdown } from "@/components/dashboard/JurisdictionBreakdown";
import { FilingsInFlight } from "@/components/dashboard/FilingsInFlight";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { LicenseInventoryProvider } from "@/components/dashboard/LicenseInventoryContext";
import { LicenseInventorySection } from "@/components/dashboard/LicenseInventorySection";
import { OverviewToolbarActions } from "@/components/dashboard/OverviewToolbar";

export const metadata: Metadata = {
  title: "Overview · ClearBot",
  description: "Live operator view of every license renewal across every location.",
};

export default function OverviewPage() {
  const today = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <LicenseInventoryProvider>
      <PageHeader
        eyebrow={`Live · synced ${today}`}
        title={
          <>
            Good morning, <span className="italic">Diana.</span>
          </>
        }
        subtitle="3 renewals need attention this week. 11 filings are already in flight. You're all caught up on everything else."
        actions={<OverviewToolbarActions />}
      />

      <KpiCards />

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <RenewalCalendar />
        <ActivityFeed />
      </section>

      <LicenseInventorySection />

      <section>
        <SectionHeader
          title="Filings in flight"
          subtitle="ClearBot is preparing or submitting these right now. Expand any row to see agency receipts."
        />
        <div className="mt-4">
          <FilingsInFlight />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHeader
            title="Agency engine"
            subtitle="528 federal, state, county, and municipal portals — watched every 90 seconds."
          />
          <div className="mt-4">
            <AgencyMonitorMockup />
          </div>
        </div>
        <div>
          <SectionHeader
            title="Jurisdiction load"
            subtitle="Where your risk is concentrated this quarter."
          />
          <div className="mt-4">
            <JurisdictionBreakdown />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <AutomationModePanel />
        <TeamPanel />
        <IntegrationsPanel />
      </section>

      <AgencyCoverageStrip />
    </LicenseInventoryProvider>
  );
}
