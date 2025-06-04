import HelpfulQuestionSection from "@/component/ui/section/HelpfulQuestionSection/HelpfulQuestionSection";
import MissionSection from "@/component/ui/section/missionsection/MissionSection";
import Herosection from "@/component/ui/section/herosection/Herosection";
import CatchSection from "@/component/ui/section/CatchSection/CatchSection";
import PricingSection from "@/component/ui/section/PricingSection/PricingSection";

export default function LandingPage() {
  return (
    <>
      <Herosection />
      <HelpfulQuestionSection />
      <MissionSection />
      <CatchSection />
      <PricingSection />
    </>
  );
}
