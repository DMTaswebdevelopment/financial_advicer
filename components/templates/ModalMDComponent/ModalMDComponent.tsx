import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { CircleXIcon } from "lucide-react";

interface ModalComponentProps {
  content: string;
  buttonText: string;
  handleClick: () => void;
  modalShow: boolean;
  setModalShow: (show: boolean) => void;
}

const ModalMDComponent: React.FC<ModalComponentProps> = ({
  content,
  modalShow,
  setModalShow,
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
                <div className="absolute right-3 top-2">
                  <button
                    className="bg-red-600 text-base text-white flex justify-center cursor-pointer items-center w-8 h-8 font-bold ursor-pointer rounded-full "
                    onClick={handleClose}
                  >
                    <CircleXIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className=" overflow-y-scroll h-full w-full px-2">
                  {content && (
                    <div
                      className="markdown-content"
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
