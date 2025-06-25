"use client";

import { CheckCircleIcon } from "@heroicons/react/20/solid";
import React from "react";

interface Item {
  id: number;
  title: string;
}

interface MissionSectionData {
  mission: Item[];
  vision: Item[];
}

const MissionSection = () => {
  const missionLists: MissionSectionData = {
    mission: [
      {
        id: 0,
        title: "Make informed financial decisions with confidence",
      },
      {
        id: 1,
        title:
          "Uncovering your financial unknown unknowns (topics and questions you didn't know you needed to explore)",
      },
      {
        id: 2,
        title:
          "Understand how the financial, legal, and accounting world operates in Australia",
      },
      {
        id: 3,
        title: "Create a more financially secure lifestyle and lasting legacy",
      },
    ],
    vision: [
      {
        id: 0,
        title:
          "Accessibility - Making quality financial education available to individuals and businesses of all sizes",
      },
      {
        id: 1,
        title:
          "Practical Application - Providing real-world strategies and tools that deliver immediate value",
      },
      {
        id: 2,
        title:
          "Personalisation - Tailoring content to your unique circumstances and goals",
      },
      {
        id: 3,
        title:
          "Professional Excellence - Supporting accounting and financial professionals with resources that enhance their expertise and their client relationships",
      },
    ],
  };

  return (
    <div className="bg-white flex text-center flex-col items-center justify-between ">
      <div className="py-16 px-5">
        <h1 className="font-playfair text-5xl md:text-6xl font-normal">
          Our Mission
        </h1>
        <div className="mx-auto mt-10 font-sans text-stone-900 text-sm lg:text-[15px] text-start w-full font-normal space-y-3  lg:max-w-7xl ">
          <p>
            At Business & Accountants Knowledge Resource Pty Ltd, we believe
            that financial education should be accessible to everyone, not just
            the privileged few. Our mission is to bridge the multigenerational
            knowledge gap that has left countless individuals and businesses
            struggling to navigate today's complex financial landscape.
          </p>

          <p>
            The current education system has failed to equip people with the
            essential financial skills needed for everyday living. Each
            generation faces evolving aspirations and expectations, yet lacks
            the foundational financial knowledge to achieve their goals. We're
            here to change that.
          </p>

          <p className="font-bold mt-7">
            Our mission is to level the playing field by providing comprehensive
            financial education that empowers individuals and businesses to:
          </p>

          {missionLists.mission.map((missionList, index) => (
            <ul className="space-y-2 ml-5 " key={index}>
              <li className="flex gap-5">
                <CheckCircleIcon className="min-w-[20px] min-h-[20px] w-5 h-5 text-black flex-shrink-0" />
                <span>{missionList.title}</span>
              </li>
            </ul>
          ))}

          <p className="font-bold mt-7">
            We are committed to fostering financial empowerment through:
          </p>

          {missionLists.vision.map((missionList, index) => (
            <ul className="space-y-2 ml-5" key={index}>
              <li className="flex gap-3 lg:gap-5 items-start w-auto">
                <CheckCircleIcon className="min-w-[20px] min-h-[20px] w-5 h-5 text-black flex-shrink-0" />
                <span>{missionList.title}</span>
              </li>
            </ul>
          ))}

          <p className="mt-7">
            Our ultimate goal is to transform the way people think about and
            manage their money and financial affairs. By equipping you with the
            right knowledge and tools, we enable you to navigate financial
            challenges with confidence, make strategic decisions that drive
            success, and build a secure financial future for yourself and your
            family.
          </p>

          <p>
            Together, we're not just teaching financial literacy – we're
            building a financially empowered community where everyone has the
            opportunity to thrive.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MissionSection;
