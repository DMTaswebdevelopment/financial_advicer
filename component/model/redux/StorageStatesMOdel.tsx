import { PDFListType } from "../types/PDFListType";
import { UserNameListType } from "../types/UserNameListType";

export interface StorageStatesModel {
  sessionData: {
    path: string;
    message: string;
  };
  userNameLists: UserNameListType;
  pdfLists: PDFListType;
  isPDFFetching: boolean;
}
