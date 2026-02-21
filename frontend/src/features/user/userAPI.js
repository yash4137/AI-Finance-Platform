import { apiClient } from "@/app/api-client";
const userApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    updateUser: builder.mutation({
      query: (formData) => ({
        url: "/user/update",
        method: "PUT",
        body: formData
      })
    })
  })
});
const { useUpdateUserMutation } = userApi;
export {
  useUpdateUserMutation,
  userApi
};
