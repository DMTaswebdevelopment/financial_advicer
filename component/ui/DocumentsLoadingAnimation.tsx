import React from "react";

const DocumentsLoadingAnimation = () => {
  return (
    <div className="w-full flex flex-col items-center lg:px-20">
      {/* Loading Animation Container */}
      <div className="flex flex-col items-center justify-center py-16">
        {/* Main Loading Animation */}
        <div className="relative mb-8">
          {/* Outer rotating ring */}
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

          {/* Inner pulsing circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
          </div>

          {/* Document icons floating around */}
          <div className="absolute -inset-8">
            <div
              className="w-6 h-6 absolute top-0 left-1/2 transform -translate-x-1/2 animate-bounce"
              style={{ animationDelay: "0s" }}
            >
              📄
            </div>
            <div
              className="w-6 h-6 absolute top-1/2 right-0 transform -translate-y-1/2 animate-bounce"
              style={{ animationDelay: "0.2s" }}
            >
              📋
            </div>
            <div
              className="w-6 h-6 absolute bottom-0 left-1/2 transform -translate-x-1/2 animate-bounce"
              style={{ animationDelay: "0.4s" }}
            >
              📊
            </div>
            <div
              className="w-6 h-6 absolute top-1/2 left-0 transform -translate-y-1/2 animate-bounce"
              style={{ animationDelay: "0.6s" }}
            >
              📈
            </div>
          </div>
        </div>

        {/* Loading Text with Typewriter Effect */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Loading Documents
            <span className="animate-pulse">...</span>
          </h2>
          <p className="text-gray-500 animate-pulse">
            Please wait while we fetch your documents
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 bg-gray-200 rounded-full h-2 mt-6">
          <div
            className="bg-blue-600 h-2 rounded-full animate-pulse"
            style={{
              width: "60%",
              animation: "loading-progress 2s ease-in-out infinite",
            }}
          ></div>
        </div>

        {/* Floating Document Cards Animation */}
        <div className="mt-12 grid grid-cols-3 gap-4 opacity-30">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="w-16 h-20 bg-white border-2 border-gray-200 rounded-lg shadow-sm animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: "1.5s",
              }}
            >
              <div className="p-2">
                <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                <div className="w-3/4 h-2 bg-gray-200 rounded mb-1"></div>
                <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-progress {
          0% {
            width: 10%;
          }
          50% {
            width: 80%;
          }
          100% {
            width: 10%;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentsLoadingAnimation;
