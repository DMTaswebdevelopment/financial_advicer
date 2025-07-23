import { DropdownMenuProps } from "@/component/model/interface/DropdownItem";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import React, { Fragment } from "react";

export default function DropdownMenu({
  buttonLabel,
  items,
}: DropdownMenuProps) {
  return (
    <div className={`relative inline-block text-right `}>
      <Menu as="div">
        <MenuButton className="inline-flex items-center gap-2 rounded-md bg-gray-800 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none hover:bg-gray-700">
          {buttonLabel}
          <ChevronDownIcon className="size-4 fill-white/60" />
        </MenuButton>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-black text-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            {items.map((item, index) => {
              if (item.label === "divider") {
                return <div key={index} className="my-1 h-px bg-white/5" />;
              }

              return (
                <MenuItem key={index} as={Fragment}>
                  {({ active }) => (
                    <button
                      onClick={item.onClick}
                      className={`group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 ${
                        active ? "bg-white/10" : ""
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  )}
                </MenuItem>
              );
            })}
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
}
