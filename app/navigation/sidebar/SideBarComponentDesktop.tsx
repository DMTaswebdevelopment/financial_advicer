import { SideBarDesktopModel } from "@/component/model/interface/SideBarDesktopModel";
import SideBarComponent from "./SideBarComponent";

const SideBarComponentDesktop = (props: SideBarDesktopModel) => {
  return (
    <div
      className={`${
        props.sidebarOpen ? "flex" : "hidden"
      } 2xl:flex fixed inset-y-0 z-10 w-96 lg:w-72 flex-col`}
    >
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <SideBarComponent mainMenu={props.mainMenu} subMenu={props.subMenu} />
      </div>
    </div>
  );
};

export default SideBarComponentDesktop;
