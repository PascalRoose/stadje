import type { Metadata } from "next";
import { HowItWorks } from "@/components/HowItWorks";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Hoe werkt het",
  description:
    "Zes pogingen, drie hints per gok: provincie, inwonersaantal en richting + afstand. Zo speel je Stadje.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader title="Hoe werkt Stadje?" />
      <div className="screen">
        <HowItWorks />
      </div>
    </>
  );
}
