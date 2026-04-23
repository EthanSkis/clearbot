import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book a free intro call · ClearBot",
  description:
    "15 minutes with the ClearBot team. A live audit of your license inventory, a risk map of your most exposed locations, and a demo of what handoff looks like.",
};

export default function BookPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg pb-24 pt-[120px] md:pt-[140px]">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <BookingFlow />
        </div>
      </main>
      <Footer />
    </>
  );
}
