import { apiClient } from "@/app/api-client";
const transactionApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    createTransaction: builder.mutation({
      query: (body) => ({
        url: "/transaction/create",
        method: "POST",
        body
      }),
      invalidatesTags: ["transactions", "analytics"]
    }),
    aiScanReceipt: builder.mutation({
      query: (formData) => ({
        url: "/transaction/scan-receipt",
        method: "POST",
        body: formData
      })
    }),
    getAllTransactions: builder.query({
      query: (params) => {
        const {
          keyword = void 0,
          type = void 0,
          recurringStatus = void 0,
          pageNumber = 1,
          pageSize = 10
        } = params;
        return {
          url: "/transaction/all",
          method: "GET",
          params: {
            keyword,
            type,
            recurringStatus,
            pageNumber,
            pageSize
          }
        };
      },
      providesTags: ["transactions"]
    }),
    getSingleTransaction: builder.query({
      query: (id) => ({
        url: `/transaction/${id}`,
        method: "GET"
      })
    }),
    duplicateTransaction: builder.mutation({
      query: (id) => ({
        url: `/transaction/duplicate/${id}`,
        method: "PUT"
      }),
      invalidatesTags: ["transactions"]
    }),
    updateTransaction: builder.mutation({
      query: ({ id, transaction }) => ({
        url: `/transaction/update/${id}`,
        method: "PUT",
        body: transaction
      }),
      invalidatesTags: ["transactions"]
    }),
    bulkImportTransaction: builder.mutation(
      {
        query: (body) => ({
          url: "/transaction/bulk-transaction",
          method: "POST",
          body
        }),
        invalidatesTags: ["transactions"]
      }
    ),
    deleteTransaction: builder.mutation({
      query: (id) => ({
        url: `/transaction/delete/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["transactions", "analytics"]
    }),
    bulkDeleteTransaction: builder.mutation({
      query: (transactionIds) => ({
        url: "/transaction/bulk-delete",
        method: "DELETE",
        body: {
          transactionIds
        }
      }),
      invalidatesTags: ["transactions", "analytics"]
    })
  })
});
const {
  useCreateTransactionMutation,
  useGetAllTransactionsQuery,
  useAiScanReceiptMutation,
  useGetSingleTransactionQuery,
  useDuplicateTransactionMutation,
  useUpdateTransactionMutation,
  useBulkImportTransactionMutation,
  useDeleteTransactionMutation,
  useBulkDeleteTransactionMutation
} = transactionApi;
export {
  transactionApi,
  useAiScanReceiptMutation,
  useBulkDeleteTransactionMutation,
  useBulkImportTransactionMutation,
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useDuplicateTransactionMutation,
  useGetAllTransactionsQuery,
  useGetSingleTransactionQuery,
  useUpdateTransactionMutation
};
