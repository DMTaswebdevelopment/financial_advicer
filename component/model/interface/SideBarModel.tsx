import { SideBarMainMenuType } from "../types/SideBarMainMenuType";
import { SideBarSubMenuType } from "../types/SideBarSubMenuType";

export interface SideBarModel {
  mainMenu: SideBarMainMenuType[];
  subMenu: SideBarSubMenuType[];
}
