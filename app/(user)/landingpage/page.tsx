"use client";

import CatchSection from "@/component/ui/section/CatchSection/CatchSection";
import HelpfulQuestionSection from "@/component/ui/section/HelpfulQuestionSection/HelpfulQuestionSection";
import Herosection from "@/component/ui/section/herosection/Herosection";
import MissionSection from "@/component/ui/section/missionsection/MissionSection";
import PricingSection from "@/component/ui/section/PricingSection/PricingSection";
import React from "react";

const LandingPage = () => {
  return (
    <>
      <Herosection />
      <HelpfulQuestionSection />
      <MissionSection />
      <CatchSection />
      <PricingSection />
    </>
  );
};

export default LandingPage;
