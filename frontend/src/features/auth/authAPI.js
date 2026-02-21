import { apiClient } from "@/app/api-client";
const authApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (credentials) => ({
        url: "/auth/register",
        method: "POST",
        body: credentials
      })
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials
      })
    }),
    //skip
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST"
      })
    }),
    refresh: builder.mutation({
      query: () => ({
        url: "/auth/refresh-token",
        method: "POST"
      })
    })
  })
});
const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshMutation,
  useLogoutMutation
} = authApi;
export {
  authApi,
  useLoginMutation,
  useLogoutMutation,
  useRefreshMutation,
  useRegisterMutation
};
