import { apiClient } from "@/app/api-client";
const analyticsApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    summaryAnalytics: builder.query({
      query: ({ preset, from, to }) => ({
        url: "/analytics/summary",
        method: "GET",
        params: { preset, from, to }
      }),
      providesTags: ["analytics"]
    }),
    chartAnalytics: builder.query({
      query: ({ preset, from, to }) => ({
        url: "/analytics/chart",
        method: "GET",
        params: { preset, from, to }
      }),
      providesTags: ["analytics"]
    }),
    expensePieChartBreakdown: builder.query({
      query: ({ preset, from, to }) => ({
        url: "/analytics/expense-breakdown",
        method: "GET",
        params: { preset, from, to }
      }),
      providesTags: ["analytics"]
    })
  })
});
const {
  useSummaryAnalyticsQuery,
  useChartAnalyticsQuery,
  useExpensePieChartBreakdownQuery
} = analyticsApi;
export {
  analyticsApi,
  useChartAnalyticsQuery,
  useExpensePieChartBreakdownQuery,
  useSummaryAnalyticsQuery
};
