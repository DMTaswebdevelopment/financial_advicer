import Image from "next/image";
import React from "react";

const FullPageLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white bg-opacity-90 flex-col space-y-8">
      <div className="flex flex-col items-center">
        <Image
          alt="loading_iamge"
          src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1744783942/ChatGPT_Image_Apr_11_2025_12_40_55_PM_copy_b5f0do.jpg"
          width={200}
          height={200}
        />
        <h1 className="text-7xl font-semibold text-blue-600 animate-pulse">
          Financial Savings
        </h1>
      </div>
      {/* Progress Bar */}
      <div className="relative w-96 h-7 bg-blue-100 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-blue-500 animate-loaderProgress"></div>
      </div>
    </div>
  );
};

export default FullPageLoader;
