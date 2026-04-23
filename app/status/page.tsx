import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { StatusBoard } from "@/components/status/StatusBoard";

export const metadata: Metadata = {
  title: "Status · ClearBot",
  description:
    "Live operational status for the ClearBot platform — API, dashboard, filing pipeline, agency monitors, and notifications.",
};

export default function StatusPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg pb-24 pt-[120px] md:pt-[140px]">
        <div className="mx-auto w-full max-w-[1040px] px-6">
          <StatusBoard />
        </div>
      </main>
      <Footer />
    </>
  );
}
