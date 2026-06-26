import { CommitPipelineSection } from "@/components/landing/commit-pipeline-section";
import { CommitWorkbenchHero } from "@/components/landing/commit-workbench-hero";
import { FaqSection } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNav } from "@/components/landing/landing-nav";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { ProofSection } from "@/components/landing/proof-section";
import { WorkflowComparisonSection } from "@/components/landing/workflow-comparison-section";

export function LandingPage({ dashboardHref }: { dashboardHref?: string }) {
  return (
    <div className="landing-page min-h-screen bg-background text-foreground">
      <LandingNav dashboardHref={dashboardHref} />
      <CommitWorkbenchHero id="home" />
      <ProblemSection id="problem" />
      <CommitPipelineSection id="how-it-works" />
      <PricingSection id="pricing" />
      <WorkflowComparisonSection id="comparison" />
      <ProofSection id="proof" />
      <FaqSection id="faq" />
      <LandingFooter />
    </div>
  );
}
