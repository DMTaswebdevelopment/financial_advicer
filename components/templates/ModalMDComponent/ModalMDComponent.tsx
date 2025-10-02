import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { CircleXIcon, Download, FileText } from "lucide-react";

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
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-white rounded-3xl shadow-amber-50 max-w-6xl h-[50rem] relative py-16 px-20
               overflow-hidden "
              >
                <div className="absolute right-3 top-2 flex gap-2">
                  {downloadPDFHandler && (
                    <button
                      className="bg-red-600 cursor-pointer text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm group"
                      onClick={downloadPDFHandler}
                      title={`Download ${documentTitle || "document"} as PDF`}
                    >
                      <FileText className="w-4 h-4 group-hover:animate-pulse" />
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  )}
                  <button
                    className="bg-red-600 text-base text-white flex justify-center cursor-pointer items-center w-8 h-8 font-bold cursor-pointer rounded-full "
                    onClick={handleClose}
                  >
                    <CircleXIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Document Title */}
                {documentTitle && (
                  <div className="mb-4 pb-2 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 truncate">
                      {documentTitle}
                    </h2>
                  </div>
                )}

                <div className="overflow-y-scroll h-full w-full px-2">
                  {content && (
                    <div
                      id="markdown-contents"
                      className="markdown-contents"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  )}
                </div>

                <div className="w-full bottom-5 flex justify-center"></div>
              </motion.div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalMDComponent;
