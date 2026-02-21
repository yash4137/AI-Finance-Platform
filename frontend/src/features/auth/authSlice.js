import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  accessToken: null,
  expiresAt: null,
  user: null,
  reportSetting: null
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.expiresAt = action.payload.expiresAt;
      state.user = action.payload.user;
      state.reportSetting = action.payload.reportSetting;
    },
    updateCredentials: (state, action) => {
      const { accessToken, expiresAt, user, reportSetting } = action.payload;
      if (accessToken !== void 0) state.accessToken = accessToken;
      if (expiresAt !== void 0) state.expiresAt = expiresAt;
      if (user !== void 0) state.user = { ...state.user, ...user };
      if (reportSetting !== void 0)
        state.reportSetting = { ...state.reportSetting, ...reportSetting };
    },
    logout: (state) => {
      state.accessToken = null;
      state.expiresAt = null;
      state.user = null;
      state.reportSetting = null;
    }
  }
});
const { setCredentials, updateCredentials, logout } = authSlice.actions;
var stdin_default = authSlice.reducer;
export {
  stdin_default as default,
  logout,
  setCredentials,
  updateCredentials
};
