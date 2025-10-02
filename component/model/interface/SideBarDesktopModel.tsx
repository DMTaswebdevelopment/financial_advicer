import { SideBarMainMenuType } from "../types/SideBarMainMenuType";
import { SideBarSubMenuType } from "../types/SideBarSubMenuType";

export interface SideBarDesktopModel {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  mainMenu: SideBarMainMenuType[];
  subMenu: SideBarSubMenuType[];
}
