import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { TrustBar } from "@/components/sections/TrustBar";
import { FearSection } from "@/components/sections/FearSection";
import { FeatureFourSteps } from "@/components/sections/FeatureFourSteps";
import { FeatureEveryAgency } from "@/components/sections/FeatureEveryAgency";
import { FeatureAutomationModes } from "@/components/sections/FeatureAutomationModes";
import { Pricing } from "@/components/sections/Pricing";
import { SocialProof } from "@/components/sections/SocialProof";
import { DataProduct } from "@/components/sections/DataProduct";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustBar />
        <FearSection />
        <FeatureFourSteps />
        <FeatureEveryAgency />
        <FeatureAutomationModes />
        <Pricing />
        <SocialProof />
        <DataProduct />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
