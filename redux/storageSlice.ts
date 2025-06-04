import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { StorageStatesModel } from "@/component/model/redux/StorageStatesMOdel";
import { UserNameListType } from "@/component/model/types/UserNameListType";
import { PDFListType } from "@/component/model/types/PDFListType";
import { DocumentsURLType } from "@/component/model/types/DocumentsURLType";
import { Message } from "@/component/model/types/ChatRequestBody";

const initialState: StorageStatesModel = {
  sessionData: {
    path: "",
    message: "",
  },
  userNameLists: {
    id: "",
    email: "",
    name: "",
    photoUrl: "",
    accessToken: "",
  },
  pdfLists: [
    {
      id: "",
      name: "",
      title: "",
      category: "",
      keywords: [""],
      url: "",
      keyQuestions: [""],
    },
  ],
  documentsURL: [],
  isPDFFetching: true,
  messages: [],
  trimMessages: "",
};

export const storageSlice = createSlice({
  name: "storage",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    // Redux Toolkit allows us to write "mutating" logic in reducers. It
    // doesn't actually mutate the state because it uses the Immer library,
    // which detects changes to a "draft state" and produces a brand new
    // immutable state based off those changes
    setSessionData: (
      state,
      action: PayloadAction<{ path: string; message: string }>
    ) => {
      state.sessionData = action.payload;
    },
    setUserNameLists: (state, action: PayloadAction<UserNameListType>) => {
      state.userNameLists = action.payload;
    },
    setPDFLists: (state, action: PayloadAction<PDFListType>) => {
      state.pdfLists = action.payload;
    },
    setIsPDFFetching: (state, action: PayloadAction<boolean>) => {
      state.isPDFFetching = action.payload;
    },
    setDocumentsURL: (state, action: PayloadAction<DocumentsURLType>) => {
      state.documentsURL = action.payload;
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    setTrimMessages: (state, action: PayloadAction<string>) => {
      state.trimMessages = action.payload;
    },
  },
});

export const {
  setSessionData,
  setUserNameLists,
  setPDFLists,
  setIsPDFFetching,
  setDocumentsURL,
  setMessages,
  setTrimMessages,
} = storageSlice.actions;

export const getSessionData = (state: RootState) =>
  state.reduxStorage.sessionData;
export const getUsers = (state: RootState) => state.reduxStorage.userNameLists;
export const getPDFList = (state: RootState) => state.reduxStorage.pdfLists;
export const getDocumentsURL = (state: RootState) =>
  state.reduxStorage.documentsURL;
export const getTrimMessages = (state: RootState) =>
  state.reduxStorage.trimMessages;

export const getMessages = (state: RootState) => state.reduxStorage.messages;
export const getIsPDFFetching = (state: RootState) =>
  state.reduxStorage.isPDFFetching;

export default storageSlice.reducer;
