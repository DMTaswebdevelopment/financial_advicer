"use client";
import { SideBarModel } from "@/component/model/interface/SideBarModel";
import { useRouter } from "next/navigation";

const SideBarComponent = (props: SideBarModel) => {
  // declare navigation
  const navigate = useRouter();

  return (
    <>
      <nav className="flex flex-1 flex-col h-full items-center justify-center">
        <ul className="flex flex-1 flex-col gap-y-7  mt-48">
          <li>
            <ul className="-mx-2 space-y-1">
              {props.mainMenu.map((item) => (
                <li key={item.name}>
                  <span
                    onClick={() => navigate.push(item.href)}
                    className={
                      "text-gray-700 sm:hover:text-dealogikal-100 sm:hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold cursor-pointer"
                    }
                  >
                    <item.icon
                      className={` text-gray-400 group-sm:hover:text-dealogikal-100 h-6 w-6 shrink-0`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default SideBarComponent;
