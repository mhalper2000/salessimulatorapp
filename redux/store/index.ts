import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import selectRoleReducer from "../slices/selectRoleSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    selectRole: selectRoleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
