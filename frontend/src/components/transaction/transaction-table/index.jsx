import { DataTable } from "@/components/data-table";
import { transactionColumns } from "./column";
import { _TRANSACTION_TYPE } from "@/constant";
import { useState } from "react";
import useDebouncedSearch from "@/hooks/use-debounce-search";
import {
  useBulkDeleteTransactionMutation,
  useGetAllTransactionsQuery
} from "@/features/transaction/transactionAPI";
import { toast } from "sonner";
const TransactionTable = (props) => {
  const [filter, setFilter] = useState({
    type: void 0,
    recurringStatus: void 0,
    pageNumber: 1,
    pageSize: props.pageSize || 10
  });
  const { debouncedTerm, setSearchTerm } = useDebouncedSearch("", {
    delay: 500
  });
  const [bulkDeleteTransaction, { isLoading: isBulkDeleting }] = useBulkDeleteTransactionMutation();
  const { data, isFetching } = useGetAllTransactionsQuery({
    keyword: debouncedTerm,
    type: filter.type,
    recurringStatus: filter.recurringStatus,
    pageNumber: filter.pageNumber,
    pageSize: filter.pageSize
  });
  const transactions = data?.transations || [];
  const pagination = {
    totalItems: data?.pagination?.totalCount || 0,
    totalPages: data?.pagination?.totalPages || 0,
    pageNumber: filter.pageNumber,
    pageSize: filter.pageSize
  };
  const handleSearch = (value) => {
    console.log(debouncedTerm);
    setSearchTerm(value);
  };
  const handleFilterChange = (filters) => {
    const { type, frequently } = filters;
    setFilter((prev) => ({
      ...prev,
      type,
      recurringStatus: frequently
    }));
  };
  const handlePageChange = (pageNumber) => {
    setFilter((prev) => ({ ...prev, pageNumber }));
  };
  const handlePageSizeChange = (pageSize) => {
    setFilter((prev) => ({ ...prev, pageSize }));
  };
  const handleBulkDelete = (transactionIds) => {
    bulkDeleteTransaction(transactionIds).unwrap().then(() => {
      toast.success("Transactions deleted successfully");
    }).catch((error) => {
      toast.error(error.data?.message || "Failed to delete transactions");
    });
  };
  return <DataTable
    data={transactions}
    columns={transactionColumns}
    searchPlaceholder="Search transactions..."
    isLoading={isFetching}
    isBulkDeleting={isBulkDeleting}
    isShowPagination={props.isShowPagination}
    pagination={pagination}
    filters={[
      {
        key: "type",
        label: "All Types",
        options: [
          { value: _TRANSACTION_TYPE.INCOME, label: "Income" },
          { value: _TRANSACTION_TYPE.EXPENSE, label: "Expense" }
        ]
      },
      {
        key: "frequently",
        label: "Frequently",
        options: [
          { value: "RECURRING", label: "Recurring" },
          { value: "NON_RECURRING", label: "Non-Recurring" }
        ]
      }
    ]}
    onSearch={handleSearch}
    onPageChange={(pageNumber) => handlePageChange(pageNumber)}
    onPageSizeChange={(pageSize) => handlePageSizeChange(pageSize)}
    onFilterChange={(filters) => handleFilterChange(filters)}
    onBulkDelete={handleBulkDelete}
  />;
};
var stdin_default = TransactionTable;
export {
  stdin_default as default
};
