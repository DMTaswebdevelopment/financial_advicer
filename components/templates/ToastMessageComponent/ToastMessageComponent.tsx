import { Fragment, useEffect, useState } from "react";
import { Transition } from "@headlessui/react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

const ToasterComponent: React.FC<ToasterComponentProps> = ({
  isOpen,
  title,
  message,
  onClose,
  type,
  duration = 5000,
  autoClose,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "bg-green-200 ";
      case "error":
        return "bg-red-200";
      case "warning":
        return "bg-orange-200";
      case "info":
        return "bg-blue-800 text-white";
      default:
        return "bg-green-600";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="w-7 h-7 text-green-800" />;
      case "error":
        return <ExclamationCircleIcon className="w-6 h-6 text-red-800" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-6 h-6 text-orange-800" />;
      case "info":
        return "ℹ";
      default:
        return "✓";
    }
  };

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setProgress(100); // Start from 100%
    } else {
      setTimeout(() => setVisible(false), 600); // Wait for exit animation
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !autoClose) {
      setProgress(100); // Reset to full when not auto-closing
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercentage = (elapsed / duration) * 100;
      const newProgress = Math.max(100 - progressPercentage, 0); // Decrease from 100 to 0
      setProgress(newProgress);

      if (newProgress <= 0) {
        clearInterval(interval);
        onClose?.(false);
      }
    }, 16); // ~60fps for smooth animation

    return () => clearInterval(interval);
  }, [isOpen, duration, autoClose, onClose]);

  const getProgressColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-green-500";
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex px-4 py-6 items-start sm:p-6 z-50"
      >
        <div className="flex w-full flex-col space-y-4 items-end">
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition
            show={isOpen}
            as={Fragment}
            enter="transform ease-out duration-700 transition"
            enterFrom="translate-x-6 opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="transform transition ease-in duration-600"
            leaveFrom="opacity-100"
            leaveTo="translate-x-6 opacity-0"
          >
            <div
              className={`relative pointer-events-auto w-full py-5 px-5 max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg ring-opacity-5 flex`}
            >
              <div className="w-full h-full flex items-center">
                <div
                  className={` ${getIconColor()}  flex items-center justify-center w-8 h-5 lg:w-16 lg:h-12 rounded-lg  text-lg `}
                >
                  {getIcon()}
                </div>

                <div className=" flex items-center ml-5  w-full text-black">
                  <div className="flex w-auto items-start flex-col">
                    <h1 className="text-xl md:text-2xl font-sans font-bold">
                      {title}
                    </h1>
                    <p className="text-sm tracking-normal ">{message}</p>
                  </div>
                </div>
                <div className="absolute -top-2 right-0 p-4">
                  <button
                    onClick={() => {
                      onClose?.(false);
                    }}
                  >
                    <XMarkIcon className="w-7 h-7 text-black" />
                  </button>
                </div>
              </div>

              {/* Loading Progress Bar */}
              {autoClose && (
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 rounded-b-2xl overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor()} transition-all duration-75 ease-linear`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
};

export default ToasterComponent;
