import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { StorageStatesModel } from "@/component/model/redux/StorageStatesMOdel";
import { UserNameListType } from "@/component/model/types/UserNameListType";
import { PDFListType } from "@/component/model/types/PDFListType";

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
      title: "",
      keywords: [""],
      fullText: "",
      storagePath: "",
      // name: "",
      // path: "",
      // url: "",
    },
  ],
  isPDFFetching: true,
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
  },
});

export const {
  setSessionData,
  setUserNameLists,
  setPDFLists,
  setIsPDFFetching,
} = storageSlice.actions;

export const getSessionData = (state: RootState) =>
  state.reduxStorage.sessionData;
export const getUsers = (state: RootState) => state.reduxStorage.userNameLists;
export const getPDFList = (state: RootState) => state.reduxStorage.pdfLists;
export const getIsPDFFetching = (state: RootState) =>
  state.reduxStorage.isPDFFetching;

export default storageSlice.reducer;
