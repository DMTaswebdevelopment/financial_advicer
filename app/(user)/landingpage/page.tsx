"use client";

import HelpfulQuestionSection from "@/component/ui/section/HelpfulQuestionSection/HelpfulQuestionSection";
import Herosection from "@/component/ui/section/herosection/Herosection";
import MissionSection from "@/component/ui/section/missionsection/MissionSection";
import PricingSection from "@/component/ui/section/PricingSection/PricingSection";
import SeriesSelectionGuide from "@/component/ui/section/SeriesSelectionGuide/SeriesSelectionGuide";
import React from "react";

const LandingPage = () => {
  return (
    <>
      <Herosection />
      <HelpfulQuestionSection />
      <MissionSection />
      <PricingSection />
      <SeriesSelectionGuide />
    </>
  );
};

export default LandingPage;
