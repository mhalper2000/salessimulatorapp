import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/selectRoleApi";

export const fetchUserDetails = createAsyncThunk(
  "selectRole/userDetails",
  api.getUserDetails,
);

export const fetchFields = createAsyncThunk(
  "selectRole/fetchFields",
  api.fetchFields,
);

export const saveUserFields = createAsyncThunk(
  "selectRole/saveFields",
  api.saveFields,
);

const slice = createSlice({
  name: "selectRole",
  initialState: {
    username: "",
    subscription: true,
    productSoldArr: [],
    prospectTitleArr: [],
    productObjectionsArr: [],
    additionalDetailsArr: [],
    scenarios: [
      {
        label: "Outbond phone call (B2B)",
        value: "outbound-phone-call-b2b",
      },
      {
        label: "Outbound phone call (B2C)",
        value: "outbound-phone-call-b2c",
      },
      { label: "Inbound phone call", value: "inbound-phone-call" },
      {
        label: "Call answered by gatekeeper (B2B)",
        value: "call-answered-by-gatekeeper-b2b",
      },
      { label: "Door-to-door (B2C)", value: "door-to-door-b2c" },
      { label: "Cold walking (B2B)", value: "cold-walking-b2b" },
    ],
    levels: [
      { label: "Friendly", value: "friendly" },
      { label: "Medium", value: "medium" },
      { label: "Difficult", value: "difficult" },
    ],
    languages: [
      { label: "Danish", value: "Danish" },
      { label: "Dutch", value: "Dutch" },
      { label: "English", value: "English" },
      { label: "Farsi (Persian)", value: "Farsi (Persian)" },
      { label: "Filipino (Tagalog)", value: "Filipino (Tagalog)" },
      { label: "Finnish", value: "Finnish" },
      { label: "French", value: "French" },
      { label: "German", value: "German" },
      { label: "Greek", value: "Greek" },
      { label: "Italian", value: "Italian" },
      { label: "Latin", value: "Latin" },
      { label: "Norwegian", value: "Norwegian" },
      { label: "Polish", value: "Polish" },
      { label: "Portuguese", value: "Portuguese" },
      { label: "Russian", value: "Russian" },
      { label: "Spanish", value: "Spanish" },
      { label: "Swedish", value: "Swedish" },
      { label: "Ukrainian", value: "Ukrainian" },
    ],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.username = action.payload.username;
        state.subscription = action.payload.subscription;
      })
      .addCase(fetchFields.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      });
  },
});

export const selectSelectRole = (state: any) => state.selectRole;
export default slice.reducer;
