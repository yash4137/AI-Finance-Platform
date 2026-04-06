import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "@/lib/api-url";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const auth = getState().auth;
    if (auth?.accessToken) {
      headers.set("Authorization", `Bearer ${auth.accessToken}`);
    }
    return headers;
  }
});
const apiClient = createApi({
  reducerPath: "api",
  baseQuery,
  refetchOnMountOrArgChange: true,
  tagTypes: ["transactions", "analytics", "billingSubscription"],
  endpoints: () => ({})
});
export {
  apiClient
};
