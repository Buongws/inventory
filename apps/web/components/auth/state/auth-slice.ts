import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, Session } from "../types/auth-types";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  initialized: false,
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.initialized = true;
    },
    clearSession: (state) => {
      state.user = null;
      state.accessToken = null;
      state.initialized = true;
    },
    markInitialized: (state) => {
      state.initialized = true;
    },
  },
});
export const { setSession, clearSession, markInitialized } = authSlice.actions;
export default authSlice.reducer;
