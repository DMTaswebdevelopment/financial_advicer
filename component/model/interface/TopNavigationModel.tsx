import { UserNavigationType } from "../types/UserNavigationType";

export interface TopNavigationModel {
  userNavigation: UserNavigationType[];
  setSidebarOpen?: (val: boolean) => void;
}
