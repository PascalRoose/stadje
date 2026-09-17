import { HowItWorks } from "@/components/HowItWorks";
import { PageHeader } from "@/components/PageHeader";

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
