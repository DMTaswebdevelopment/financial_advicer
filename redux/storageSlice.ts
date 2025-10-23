import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { StorageStatesModel } from "@/component/model/redux/StorageStatesMOdel";
import { UserNameListType } from "@/component/model/types/UserNameListType";
import { PDFListType } from "@/component/model/types/PDFListType";
import { DocumentsURLType } from "@/component/model/types/DocumentsURLType";
import { Message } from "@/component/model/types/ChatRequestBody";
import { GroupedDocument } from "@/component/model/interface/GroupedDocument";
import FetchingDMFiles from "@/component/model/interface/FetchingDMFiles";
import {
  MDFilesPageCache,
  PaginationInfo,
} from "@/component/model/interface/PaginationInfo";

// Extended initial state
const initialState: StorageStatesModel = {
  sessionData: {
    path: "",
    message: "",
  },
  userNameLists: {
    id: "",
    email: "",
    interval: "",
    name: "",
    photoUrl: "",
    accessToken: "",
    userRole: "",
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
  isMessageSend: false,
  isLogin: false,
  isPDFFetching: false,
  messages: [],
  trimMessages: "",
  isUserSubscribed: false,
  allDocumentLists: [],
  mdDocumentsURL: [],
  isDocumentNumberSelected: false,
  fetchingMDFiles: [], // Keep for backward compatibility

  // New: Pagination cache (simple version - no timestamps)
  mdFilesCache: {} as Record<number, MDFilesPageCache>,
};

export const storageSlice = createSlice({
  name: "storage",
  initialState,
  reducers: {
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
    isLogin: (state, action: PayloadAction<boolean>) => {
      state.isLogin = action.payload;
    },
    setIsMessageSend: (state, action: PayloadAction<boolean>) => {
      state.isMessageSend = action.payload;
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
    setIsUserSubscribed: (state, action: PayloadAction<boolean>) => {
      state.isUserSubscribed = action.payload;
    },
    setAllDocumentLists: (state, action: PayloadAction<GroupedDocument[]>) => {
      state.allDocumentLists = action.payload;
    },
    setMDDocumentsURL: (
      state,
      action: PayloadAction<{ id: string; desc: string }[]>
    ) => {
      state.mdDocumentsURL = action.payload;
    },
    setFetchingMDFiles: (state, action: PayloadAction<FetchingDMFiles[]>) => {
      state.fetchingMDFiles = action.payload;
    },
    setIsDocumentNumberSelected: (state, action: PayloadAction<boolean>) => {
      state.isDocumentNumberSelected = action.payload;
    },

    // Pagination cache actions (simplified)
    setMDFilesPage: (
      state,
      action: PayloadAction<{
        page: number;
        files: FetchingDMFiles[];
        pagination: PaginationInfo;
      }>
    ) => {
      const { page, files, pagination } = action.payload;
      state.mdFilesCache[page] = {
        files,
        pagination,
      };
    },

    // Update a specific file in cached page (e.g., after generating link)
    updateMDFileInCache: (
      state,
      action: PayloadAction<{
        page: number;
        fileName: string;
        updates: Partial<FetchingDMFiles>;
      }>
    ) => {
      const { page, fileName, updates } = action.payload;
      const pageCache = state.mdFilesCache[page];

      if (pageCache) {
        pageCache.files = pageCache.files.map((file) =>
          file.name === fileName ? { ...file, ...updates } : file
        );
      }
    },

    // Invalidate specific page (force refetch on next access)
    invalidateMDFilesPage: (state, action: PayloadAction<number>) => {
      delete state.mdFilesCache[action.payload];
    },

    // Clear all cached pages
    clearMDFilesCache: (state) => {
      state.mdFilesCache = {};
    },
  },
});

export const {
  setSessionData,
  setUserNameLists,
  setPDFLists,
  isLogin,
  setDocumentsURL,
  setMessages,
  setTrimMessages,
  setIsMessageSend,
  setIsPDFFetching,
  setIsUserSubscribed,
  setAllDocumentLists,
  setMDDocumentsURL,
  setIsDocumentNumberSelected,
  setFetchingMDFiles,
  setMDFilesPage,
  updateMDFileInCache,
  invalidateMDFilesPage,
  clearMDFilesCache,
} = storageSlice.actions;

// Existing selectors
export const getSessionData = (state: RootState) =>
  state.reduxStorage.sessionData;
export const getUsers = (state: RootState) => state.reduxStorage.userNameLists;
export const getPDFList = (state: RootState) => state.reduxStorage.pdfLists;
export const getIsPDFFetching = (state: RootState) =>
  state.reduxStorage.isPDFFetching;
export const getDocumentsURL = (state: RootState) =>
  state.reduxStorage.documentsURL;
export const getTrimMessages = (state: RootState) =>
  state.reduxStorage.trimMessages;
export const getMDDocumentsURL = (state: RootState) =>
  state.reduxStorage.mdDocumentsURL;
export const getFetchingMDFiles = (state: RootState) =>
  state.reduxStorage.fetchingMDFiles;
export const getMessages = (state: RootState) => state.reduxStorage.messages;
export const getisLogin = (state: RootState) => state.reduxStorage.isLogin;
export const getIsDocumentNumberSelected = (state: RootState) =>
  state.reduxStorage.isDocumentNumberSelected;
export const getIsUserSubscribed = (state: RootState) =>
  state.reduxStorage.isUserSubscribed;
export const getAllDocumentLists = (state: RootState) =>
  state.reduxStorage.allDocumentLists;
export const getIsMessageSend = (state: RootState) =>
  state.reduxStorage.isMessageSend;

// Pagination cache selectors
export const getMDFilesPage = (state: RootState, page: number) =>
  state.reduxStorage.mdFilesCache[page] || null;

export const getMDFilesCacheAll = (state: RootState) =>
  state.reduxStorage.mdFilesCache;

export const getMDFilesCachedPages = (state: RootState) =>
  Object.keys(state.reduxStorage.mdFilesCache).map(Number);

export default storageSlice.reducer;
