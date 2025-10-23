import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { X, Download, FileText } from "lucide-react";

interface ModalComponentProps {
  content: string;
  buttonText: string;
  handleClick: () => void;
  modalShow: boolean;
  setModalShow: (show: boolean) => void;
  downloadPDFHandler?: () => void;
  documentTitle?: string;
}

const ModalMDComponent: React.FC<ModalComponentProps> = ({
  content,
  modalShow,
  setModalShow,
  downloadPDFHandler,
  documentTitle,
}) => {
  const handleClose = () => {
    setModalShow(false);
  };

  return (
    <Transition show={modalShow} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 md:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full h-full flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-white rounded-lg sm:rounded-2xl md:rounded-3xl shadow-xl w-full h-full 
                sm:h-auto sm:max-h-[90vh] md:max-h-[85vh] max-w-6xl relative 
                py-12 sm:py-14 md:py-16 px-4 sm:px-8 md:px-12 lg:px-20
                overflow-hidden flex flex-col"
              >
                {/* Header with buttons */}
                <div className="absolute right-2 sm:right-3 top-2 flex gap-1.5 sm:gap-2 z-10">
                  {downloadPDFHandler && (
                    <button
                      className="bg-red-600 cursor-pointer text-white flex items-center gap-1 sm:gap-2 
                      px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-700 
                      transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 
                      font-medium text-xs sm:text-sm group"
                      onClick={downloadPDFHandler}
                      title={`Download ${documentTitle || "document"} as PDF`}
                    >
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 group-hover:animate-pulse" />
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  )}
                  <button
                    className="bg-red-600 text-white flex justify-center cursor-pointer items-center 
                    w-7 h-7 sm:w-8 sm:h-8 font-bold rounded-full hover:bg-red-700 transition-colors"
                    onClick={handleClose}
                    aria-label="Close modal"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Document Title */}
                {documentTitle && (
                  <div className="mb-3 sm:mb-4 pb-2 border-b border-gray-200 flex-shrink-0">
                    <h2
                      className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 
                    truncate pr-16 sm:pr-20"
                    >
                      {documentTitle}
                    </h2>
                  </div>
                )}

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 w-full px-1 sm:px-2 -mx-1 sm:-mx-2">
                  {content && (
                    <div
                      id="markdown-contents"
                      className="markdown-contents prose prose-sm sm:prose md:prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  )}
                </div>
              </motion.div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalMDComponent;
