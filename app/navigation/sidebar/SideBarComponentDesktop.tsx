import { SideBarDesktopModel } from "@/component/model/interface/SideBarDesktopModel";
import SideBarComponent from "./SideBarComponent";

const SideBarComponentDesktop = (props: SideBarDesktopModel) => {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-72 lg:flex-col">
      {/* Sidebar component, swap this element with another sidebar if you like */}
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        {/* embedded the dynamic sidebar components here */}
        <SideBarComponent mainMenu={props.mainMenu} subMenu={props.subMenu} />
      </div>
    </div>
  );
};

export default SideBarComponentDesktop;
