import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
const useEditTransactionDrawer = () => {
  const [open, setOpen] = useQueryState(
    "edit",
    parseAsBoolean.withDefault(false)
  );
  const [transactionId, setTransactionId] = useQueryState(
    "transactionId",
    parseAsString.withDefault("")
  );
  const onOpenDrawer = (transactionId2) => {
    setTransactionId(transactionId2);
    setOpen(true);
  };
  const onCloseDrawer = () => {
    setTransactionId("");
    setOpen(false);
  };
  return {
    open,
    transactionId,
    onOpenDrawer,
    onCloseDrawer
  };
};
var stdin_default = useEditTransactionDrawer;
export {
  stdin_default as default
};
