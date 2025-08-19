"use client";

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { CircleXIcon } from "lucide-react";

interface ModalComponentProps {
  paragraph: string;
  handleClick: () => void;
  modalShow: boolean;
  setModalShow: (show: boolean) => void;
}

const ModalComponent: React.FC<ModalComponentProps> = ({
  paragraph,
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
                className="bg-white rounded-3xl shadow-amber-50 max-w-xl h-auto relative p-8 "
              >
                <div className="absolute right-3 top-2">
                  <button
                    className="bg-red-600 text-base text-white flex justify-center cursor-pointer items-center w-8 h-8 font-bold ursor-pointer rounded-full "
                    onClick={handleClose}
                  >
                    <CircleXIcon className="w-4 h-4" />
                  </button>
                </div>

                <h1 className="text-center text-4xl font-bold font-sans">
                  Description
                </h1>
                <div className="flex flex-col justify-center items-center text-start h-full">
                  {paragraph && (
                    <p className="mt-4 text-gray-700 text-base leading-relaxed">
                      {paragraph}
                    </p>
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

export default ModalComponent;
