"use client";

import React, { useEffect, useState } from "react";

const HelpfulQuestionSection: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    // Function to update state
    const handleResize = () => setWindowWidth(window.innerWidth);

    // Set initial width
    handleResize();

    // Listen to resize
    window.addEventListener("resize", handleResize);

    // Clean up listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // max-w-[1920px] mx-auto

  const TopBubbleSVG: React.FC = () => {
    return (
      <>
        <div
          style={{ position: "absolute" }}
          className="lg:left-24 xl:left-40 2xl:left-32 2xl:top-0 hidden md:inline-block"
        >
          {windowWidth >= 1536 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="455"
                height="231"
                viewBox="0 0 455 231"
                fill="none"
              >
                <path
                  d="M33.9541 0H421.046C439.798 0 455 15.2215 455 33.9975V150.558C455 169.334 439.798 184.555 421.046 184.555H196.592L165.954 230.27V184.555H33.9541C15.2021 184.555 0 169.334 0 150.558V33.9975C0 15.2215 15.2021 0 33.9541 0Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1280 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="294"
                height="149"
                viewBox="0 0 294 149"
                fill="none"
              >
                <path
                  d="M22.7491 0.571167H271.966C284.039 0.571167 293.826 10.3711 293.826 22.4594V97.5029C293.826 109.591 284.039 119.391 271.966 119.391H127.459L107.733 148.823V119.391H22.7491C10.6762 119.391 0.888755 109.591 0.888755 97.5029V22.4594C0.888755 10.3711 10.6762 0.571167 22.7491 0.571167Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1024 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="240"
              height="122"
              viewBox="0 0 240 122"
              fill="none"
            >
              <path
                d="M18.1524 0.115173H221.791C231.656 0.115173 239.653 8.1228 239.653 18.0003V79.3195C239.653 89.197 231.656 97.2046 221.791 97.2046H103.712L87.5938 121.254V97.2046H18.1524C8.28746 97.2046 0.290039 89.197 0.290039 79.3195V18.0003C0.290039 8.1228 8.28746 0.115173 18.1524 0.115173Z"
                fill="#1C1B1A"
              />
            </svg>
          ) : (
            <></>
          )}
          <div className="absolute items-center top-1 xl:top-2 2xl:top-5  shrink-0 lg:text-[15px] xl:text-[16px] 2xl:text-2xl font-playfair text-[#FFF3E5] lg:left-2 xl:left-5 xl:right-5 justify-center">
            "My manufacturing client bought $500,000 in equipment. Should they
            use diminishing value or prime cost method for better tax benefits?"
          </div>
        </div>
        <div
          style={{ position: "absolute", display: "inline-block" }}
          className="lg:right-12 xl:right-28  2xl:top-0"
        >
          {windowWidth >= 1536 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="478"
                height="199"
                viewBox="0 0 478 199"
                fill="none"
              >
                <path
                  d="M448.028 0L29.9724 0C13.4194 0 0 13.1545 0 29.3807V130.112C0 146.338 13.4194 159.493 29.9724 159.493H398.709L425.755 199V159.493H448.028C464.581 159.493 478 146.338 478 130.112V29.3807C478 13.1545 464.581 0 448.028 0Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1280 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="350"
                height="149"
                viewBox="0 0 350 149"
                fill="none"
              >
                <path
                  d="M327.43 0.571167L22.5229 0.571167C10.45 0.571167 0.662598 10.3711 0.662598 22.4594V97.5029C0.662598 109.591 10.45 119.391 22.5229 119.391H291.46L311.186 148.823V119.391H327.43C339.503 119.391 349.29 109.591 349.29 97.5029V22.4594C349.29 10.3711 339.503 0.571167 327.43 0.571167Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1024 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="286"
              height="122"
              viewBox="0 0 286 122"
              fill="none"
            >
              <path
                d="M267.484 0.115173L18.3404 0.115173C8.47544 0.115173 0.478027 8.1228 0.478027 18.0003V79.3195C0.478027 89.197 8.47544 97.2046 18.3404 97.2046H238.093L254.211 121.254V97.2046H267.484C277.349 97.2046 285.347 89.197 285.347 79.3195V18.0003C285.347 8.1228 277.349 0.115173 267.484 0.115173Z"
                fill="#1C1B1A"
              />
            </svg>
          ) : (
            <></>
          )}

          <div className="absolute items-center top-2 2xl:top-5 lg:text-[15px] xl:text-[16px] 2xl:text-2xl shrink-0 font-playfair text-[#FFF3E5] lg:left-2 xl:left-5 right-5 justify-center">
            "We're buying a $650,000 home and heard about mortgage interest
            deductions for investment properties. What are the actual tax
            benefits of property ownership?"
          </div>
        </div>
      </>
    );
  };

  const BottomBubbleSVG: React.FC = () => {
    return (
      <>
        <div
          style={{ position: "absolute", display: "inline-block" }}
          className="left-5 xl:left-0 lg:top-48  2xl:top-64"
        >
          {windowWidth >= 1536 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="380"
                height="231"
                viewBox="0 0 380 231"
                fill="none"
              >
                <path
                  d="M27.0494 0H352.951C367.889 0 380 15.2215 380 33.9975V150.558C380 169.334 367.889 184.555 352.951 184.555H71.5578L47.1496 230.27V184.555H27.0494C12.1107 184.555 0 169.334 0 150.558V33.9975C0 15.2215 12.1107 0 27.0494 0Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1280 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="308"
                height="149"
                viewBox="0 0 308 149"
                fill="none"
              >
                <path
                  d="M21.8604 0.470703H285.241C297.314 0.470703 307.102 10.2706 307.102 22.3589V97.4025C307.102 109.491 297.314 119.291 285.241 119.291H57.8304L38.1047 148.723V119.291H21.8604C9.78753 119.291 0.000139117 109.491 0.000139117 97.4025V22.3589C0.000139117 10.2706 9.78753 0.470703 21.8604 0.470703Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1024 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="250"
              height="121"
              viewBox="0 0 250 121"
              fill="none"
            >
              <path
                d="M17.7957 0H232.204C242.032 0 250 7.99844 250 17.8646V79.1134C250 88.9796 242.032 96.9781 232.204 96.9781H47.0775L31.0195 121V96.9781H17.7957C7.96756 96.9781 0 88.9796 0 79.1134V17.8646C0 7.99844 7.96756 0 17.7957 0Z"
                fill="#1C1B1A"
              />
            </svg>
          ) : (
            <></>
          )}

          <div className="absolute  items-center lg:top-1 xl:top-2 lg:text-[15px] xl:text-[16px] 2xl:text-2xl font-playfair text-[#FFF3E5] left-3 xl:left-5 xl:right-5 justify-center">
            “My landscaping business has great summer revenue but struggles in
            winter. What financial strategies can help manage seasonal cash
            flow?”
          </div>
        </div>

        <div
          style={{ position: "absolute", display: "" }}
          className="xl:left-[20rem] lg:left-[17.9rem] 2xl:left-[25rem] xl:top-64 lg:top-48 2xl:top-96"
        >
          {windowWidth >= 1536 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="375"
                height="227"
                viewBox="0 0 375 227"
                fill="none"
              >
                <path
                  d="M345.523 0H29.4772C13.1977 0 0 11.7642 0 26.2754V165.393C0 179.904 13.1977 191.668 29.4772 191.668H297.02L323.619 227V191.668H345.523C361.802 191.668 375 179.904 375 165.393V26.2754C375 11.7642 361.802 0 345.523 0Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1280 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="279"
                height="190"
                viewBox="0 0 279 190"
                fill="none"
              >
                <path
                  d="M256.669 0.798706H22.29C10.2171 0.798706 0.429688 10.5986 0.429688 22.6869V138.576C0.429688 150.664 10.2171 160.464 22.29 160.464H220.699L240.425 189.896V160.464H256.669C268.742 160.464 278.53 150.664 278.53 138.576V22.6869C278.53 10.5986 268.742 0.798706 256.669 0.798706Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1024 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="228"
              height="156"
              viewBox="0 0 228 156"
              fill="none"
            >
              <path
                d="M209.461 0.723877H17.9463C8.0814 0.723877 0.0839844 8.7315 0.0839844 18.609V113.304C0.0839844 123.181 8.0814 131.189 17.9463 131.189H180.069L196.188 155.238V131.189H209.461C219.326 131.189 227.323 123.181 227.323 113.304V18.609C227.323 8.7315 219.326 0.723877 209.461 0.723877Z"
                fill="#1C1B1A"
              />
            </svg>
          ) : (
            <></>
          )}

          <div className="absolute items-center top-2 xl:text-[16px] 2xl:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
            “We're expanding our consulting firm and considering staying as a
            partnership or incorporating as a company. What are the tax
            implications of each structure?”
          </div>
        </div>
      </>
    );
  };

  const BottomRightBubbleSVG: React.FC = () => {
    return (
      <>
        <div
          style={{ position: "absolute", display: "inline-block" }}
          className="xl:right-[25rem] lg:right-[18rem] 2xl:right-[25rem] lg:top-48 xl:top-64 2xl:top-96"
        >
          {windowWidth >= 1536 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="307"
                height="237"
                viewBox="0 0 307 237"
                fill="none"
              >
                <path
                  d="M31.4447 0H275.555C292.921 0 307 11.0417 307 24.6618V179.176C307 192.796 292.921 203.838 275.555 203.838H167.203L138.829 237V203.838H31.4447C14.0786 203.838 9.79544e-06 192.796 9.79544e-06 179.176V24.6618C9.79544e-06 11.0417 14.0786 0 31.4447 0Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1280 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="214"
                height="212"
                viewBox="0 0 214 212"
                fill="none"
              >
                <path
                  d="M22.1034 0.798706H191.809C203.882 0.798706 213.669 10.5986 213.669 22.6869V159.823C213.669 171.912 203.882 181.712 191.809 181.712H116.482L96.7566 211.144V181.712H22.1034C10.0305 181.712 0.243094 171.912 0.243094 159.823V22.6869C0.243094 10.5986 10.0305 0.798706 22.1034 0.798706Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1024 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="176"
              height="173"
              viewBox="0 0 176 173"
              fill="none"
            >
              <path
                d="M18.8314 0.723877H157.5C167.365 0.723877 175.362 8.7315 175.362 18.609V130.665C175.362 140.543 167.365 148.55 157.5 148.55H95.9498L79.8316 172.6V148.55H18.8314C8.96646 148.55 0.96904 140.543 0.96904 130.665V18.609C0.96904 8.7315 8.96646 0.723877 18.8314 0.723877Z"
                fill="#1C1B1A"
              />
            </svg>
          ) : (
            <></>
          )}

          <div className="absolute items-center top-2 lg:text-[14px] xl:text-[16px] shrink-0 2xl:text-2xl font-playfair text-[#FFF3E5] lg:left-2 xl:left-5 lg:right-2  xl:right-5 justify-center">
            “My retail client needs to choose between FIFO and weighted average
            cost methods. How will each affect their taxes with current
            inflation?”
          </div>
        </div>

        <div
          style={{ position: "absolute", display: "inline-block" }}
          className="right-20 lg:right-5 2xl:right-0 lg:top-48 2xl:top-64"
        >
          {windowWidth >= 1536 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="380"
                height="230"
                viewBox="0 0 380 230"
                fill="none"
              >
                <path
                  d="M353.145 0L26.855 0C12.0236 0 -6.03423e-06 15.2036 -6.03423e-06 33.9576V150.381C-6.03423e-06 169.135 12.0236 184.338 26.855 184.338H308.957L333.189 230V184.338H353.145C367.976 184.338 380 169.135 380 150.381V33.9576C380 15.2036 367.976 0 353.145 0Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1280 ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="310"
                height="149"
                viewBox="0 0 310 149"
                fill="none"
              >
                <path
                  d="M288.14 0.470703L22.5356 0.470703C10.4627 0.470703 0.675288 10.2706 0.675288 22.3589V97.4025C0.675288 109.491 10.4627 119.291 22.5356 119.291H252.17L271.896 148.723V119.291H288.14C300.213 119.291 310 109.491 310 97.4025V22.3589C310 10.2706 300.213 0.470703 288.14 0.470703Z"
                  fill="#1C1B1A"
                />
              </svg>
            </>
          ) : windowWidth >= 1024 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="253"
              height="122"
              viewBox="0 0 253 122"
              fill="none"
            >
              <path
                d="M235.138 0.57666L18.1089 0.57666C8.24399 0.57666 0.246578 8.58429 0.246578 18.4618V79.781C0.246578 89.6585 8.24399 97.6661 18.1089 97.6661H205.746L221.865 121.716V97.6661H235.138C245.003 97.6661 253 89.6585 253 79.781V18.4618C253 8.58429 245.003 0.57666 235.138 0.57666Z"
                fill="#1C1B1A"
              />
            </svg>
          ) : (
            <></>
          )}

          <div className="absolute items-center lg:top-1 xl:top-2 text-lg lg:text-[15px] xl:text-[16px] 2xl:text-2xl font-playfair text-[#FFF3E5] lg:left-2 xl:left-5 xl:right-5 justify-center">
            “I'm 45 earning $85,000 and confused about salary sacrificing vs
            after-tax super contributions. Which strategy is better for my
            situation?”
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="relative flex justify-center p-4 lg:h-[370px] xl:h-[600px] transform -translate-y-16 xl:-translate-y-5  2xl:-translate-y-24">
      {windowWidth > 1023 ? (
        <>
          <TopBubbleSVG />
          <div className="w-full relative">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-xl md:text-4xl font-playfair font-light text-[#1C1B1A] mb-4">
                Not sure what to ask?
              </h1>
              <p className="text-black text-[15px]  max-w-2xl mx-auto leading-relaxed font-sans">
                Use these example questions as inspiration!
                <br />
                Wherever you are in life, we&apos;re here to help.
              </p>
            </div>

            {/* Speech Bubbles */}
            <div className="flex flex-col w-full lg:flex-row gap-5 md:gap-6 items-center justify-center font-playfair">
              <BottomBubbleSVG />
              {/* right section */}
              <BottomRightBubbleSVG />
            </div>
          </div>
        </>
      ) : (
        <>test</>
      )}
    </div>
  );
};

export default HelpfulQuestionSection;
