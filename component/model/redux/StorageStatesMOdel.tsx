import { Message } from "../types/ChatRequestBody";
import { DocumentsURLType } from "../types/DocumentsURLType";
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
  documentsURL: DocumentsURLType;
  messages: Message[];
  trimMessages: string;
}
