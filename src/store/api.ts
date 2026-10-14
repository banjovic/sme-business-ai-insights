import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type StockItemDTO = { id: string; name: string; quantityOnHand: number; reorderPoint: number; unitPrice: number };
export type SaleDTO = { id: string; itemId: string; itemName: string; quantitySold: number; amount: number; date: string };
export type ExpenseDTO = { id: string; category: string; amount: number; date: string };
export type InsightDTO = { id: string; type: string; severity: string; message: string; generatedAt: string };
export type ChatMessageDTO = { id: string; question: string; answer: string; timestamp: string };

// RTK Query's built-in caching and automatic re-fetching (see Chapter 4,
// Table 4.1) means the dashboard, logging forms, and chat all share one
// consistent, de-duplicated view of server data without hand-written
// loading/error state plumbing in every component.
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["StockItems", "Sales", "Expenses", "Insights", "Chat"],
  endpoints: (builder) => ({
    getStockItems: builder.query<StockItemDTO[], void>({ query: () => "/stock", providesTags: ["StockItems"] }),
    getSales: builder.query<SaleDTO[], void>({ query: () => "/sales", providesTags: ["Sales"] }),
    addSale: builder.mutation<SaleDTO, { itemId: string; quantitySold: number; amount: number; date: string }>({
      query: (body) => ({ url: "/sales", method: "POST", body }),
      invalidatesTags: ["Sales", "StockItems", "Insights"],
    }),
    addStockItem: builder.mutation<StockItemDTO, { name: string; quantityOnHand: number; reorderPoint: number; unitPrice: number }>({
      query: (body) => ({ url: "/stock", method: "POST", body }),
      invalidatesTags: ["StockItems", "Insights"],
    }),
    restockItem: builder.mutation<StockItemDTO, { itemId: string; quantity: number }>({
      query: ({ itemId, quantity }) => ({ url: `/stock/${itemId}/restock`, method: "POST", body: { quantity } }),
      invalidatesTags: ["StockItems", "Insights"],
    }),
    getExpenses: builder.query<ExpenseDTO[], void>({ query: () => "/expenses", providesTags: ["Expenses"] }),
    addExpense: builder.mutation<ExpenseDTO, { category: string; amount: number; date: string }>({
      query: (body) => ({ url: "/expenses", method: "POST", body }),
      invalidatesTags: ["Expenses", "Insights"],
    }),
    getInsights: builder.query<InsightDTO[], void>({ query: () => "/insights", providesTags: ["Insights"] }),
    getChatHistory: builder.query<ChatMessageDTO[], void>({ query: () => "/chat", providesTags: ["Chat"] }),
    askQuestion: builder.mutation<ChatMessageDTO, { question: string }>({
      query: (body) => ({ url: "/chat", method: "POST", body }),
      invalidatesTags: ["Chat"],
    }),
  }),
});

export const {
  useGetStockItemsQuery, useGetSalesQuery, useAddSaleMutation, useAddStockItemMutation,
  useRestockItemMutation, useGetExpensesQuery, useAddExpenseMutation, useGetInsightsQuery,
  useGetChatHistoryQuery, useAskQuestionMutation,
} = api;
