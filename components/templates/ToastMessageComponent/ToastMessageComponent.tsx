import { Fragment } from "react";
import { Transition } from "@headlessui/react";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

const ToasterComponent: React.FC<ToasterComponentProps> = ({
  isOpen,
  title,
  message,
  onClose,
  type,
}) => {
  const getTypeClasses = () => {
    switch (type) {
      case "success":
        return "bg-teal-600 ";
      case "error":
        return "bg-red-600";
      case "warning":
        return "bg-yellow-600";
      case "info":
        return "bg-blue-600";
      default:
        return "bg-green-600";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "bg-teal-800 ";
      case "error":
        return "bg-red-800";
      case "warning":
        return "bg-yellow-800";
      case "info":
        return "bg-blue-800 text-white";
      default:
        return "bg-green-600";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckIcon className="w-6 h-6 text-white" />;
      case "error":
        return <XMarkIcon className="w-6 h-6 text-white" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-6 h-6 text-white" />;
      case "info":
        return "ℹ";
      default:
        return "✓";
    }
  };

  const bubleColor = () => {
    switch (type) {
      case "success":
        return "bg-teal-800";
      case "error":
        return "bg-red-800";
      case "warning":
        return "bg-yellow-800";
      case "info":
        return "bg-blue-800";
      default:
        return "✓";
    }
  };
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
              className={`relative pointer-events-auto w-full max-w-sm py-7 overflow-visible rounded-2xl ${getTypeClasses()} shadow-lg ring-1 ring-black ring-opacity-5 flex`}
            >
              <div
                className={`absolute ${getIconColor()} -top-4 translate-x-6 flex items-center justify-center w-9 h-9 lg:w-12 lg:h-12 rounded-full  mr-4 text-lg `}
              >
                {getIcon()}
              </div>
              <div className="absolute left-1 bottom-0 opacity-40 overflow-hidden">
                <div
                  className={`${bubleColor()} rounded-full h-5 w-5 -mb-1 ml-1`}
                ></div>
                <div
                  className={`${bubleColor()} rounded-full h-8 w-8 -mb-2 ml-4`}
                ></div>
                <div
                  className={`${bubleColor()} rounded-full h-10 w-10 -mb-3 ml-2 `}
                ></div>
              </div>
              <div className=" flex items-center justify-center  w-full text-white">
                <div className="flex justify-center place-content-center w-60 items-start flex-col">
                  <h1 className="text-xl md:text-2xl font-brigoli text-white">
                    {title}
                  </h1>
                  <p className="text-sm tracking-normal ">{message}</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={() => {
                    onClose?.(false);
                  }}
                >
                  <XMarkIcon className="w-7 h-7 text-white" />
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
};

export default ToasterComponent;
