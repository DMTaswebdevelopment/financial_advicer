import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import storageReducer from "./storageSlice";

export const store = configureStore({
  reducer: {
    reduxStorage: storageReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
