import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <div className="flex text-center flex-col items-center justify-between">
      <div className="py-20 px-5">
        <h1 className="font-playfair text-5xl md:text-6xl font-normal">
          Privacy Policy
        </h1>
        <div className="mx-auto mt-10 font-sans text-stone-900 text-sm lg:text-[15px] text-start w-full font-normal  lg:max-w-4xl ">
          <div className="mt-10 ">
            <h2 className="font-bold leading-10">Your Data Stays Yours</h2>
            <p className="">
              Unlike many websites, we have zero interest in collecting,
              storing, or selling your personal data. We&apos;re not here to
              build advertising profiles or track your browsing habits.
            </p>
          </div>
          <div className="mt-5">
            <h2 className="font-bold leading-10">What We Don&apos;t Collect</h2>
            <p>- Browsing history or tracking data</p>
            <p>- Personal information beyond what&apos;s necessary</p>
            <p>- Data to sell to third parties</p>
            <p>- Unnecessary cookies or analytics</p>
          </div>
          <div className="mt-5">
            <h2 className="font-bold leading-10">
              What We Do Collect (And Why)
            </h2>
            <p className="">
              The only personal information we collect is your email address,
              and only if you choose to purchase a subscription. That&apos;s it.
              We need this solely to manage your account and provide the service
              you&apos;ve paid for.
            </p>
          </div>

          <div className="mt-5">
            <h2 className="font-bold leading-10">Our Mission is Simple</h2>
            <p className="">
              We believe financial information should be accessible to everyone,
              not locked away behind paywalls or scattered across dozens of
              different sources. While we know that complex financial situations
              often benefit from professional guidance tailored to your specific
              circumstances, the basic information and tools to understand your
              options should always be free and easy to find.
            </p>
          </div>

          <div className="mt-5">
            <p className="">
              Our goal is to create one comprehensive place where you can ask
              questions and get clear answers about financial topics—without the
              runaround, without the data harvesting, and without the fees that
              often put crucial information out of reach.
            </p>
          </div>

          <div className="mt-5">
            <h2 className="font-bold leading-10">The Bottom Line</h2>
            <p className="">
              Your privacy matters. Your data is yours. We&apos;re here to
              provide financial information, not to become another company
              profiting from your personal details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
