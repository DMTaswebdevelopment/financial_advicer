import React from "react";
import LoadingSpinnerComponent from "../LoadingSpinnerComponent/LoadingSpinnerComponent";

const FullPageLoadingComponent = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/45 flex-col space-y-8">
      <div className="flex flex-col items-center">
        <LoadingSpinnerComponent />
      </div>
    </div>
  );
};
export default FullPageLoadingComponent;
