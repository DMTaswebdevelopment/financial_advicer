import React from "react";

const MissionSection = () => {
  return (
    <div className="bg-white flex text-center flex-col items-center justify-between">
      <div className="py-16">
        <h1 className="font-playfair text-6xl font-normal ">Our Mission</h1>
        <div className="mx-auto mt-10 font-sans text-[20px] text-center font-normal  w-[1170px] text-[#1C1B1A]">
          <p>
            {" "}
            At our core, we believe that access to clear, trustworthy financial
            advice is a fundamental right—not a privilege.{" "}
          </p>
          <br />
          <p>
            Our mission is to empower individuals from all walks of life by
            providing free, unbiased financial guidance that helps them make
            informed decisions and build a more secure future.
          </p>
          <br />
          <p>
            We are committed to breaking down the barriers that prevent people
            from understanding their finances by offering easy-to-access,
            jargon-free support tailored to real-life needs. Because when people
            have the right information, they gain the confidence to take control
            of their financial well-being—and that benefits everyone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MissionSection;
