import { DateRangeSelect } from "@/components/date-range-select";
import AddTransactionDrawer from "@/components/transaction/add-transaction-drawer";
const DashboardHeader = ({ title, subtitle, dateRange, setDateRange }) => {
  return <div className="flex flex-col lg:flex-row items-start justify-between space-y-7">
      <div className="space-y-1">
        <h2 className="text-2xl lg:text-4xl font-medium">{title}</h2>
        <p className="text-white/60 text-sm">{subtitle}</p>
      </div>
      <div className="flex justify-end gap-4 mb-6">
      <DateRangeSelect dateRange={dateRange || null} setDateRange={(range) => setDateRange?.(range)} />
        <AddTransactionDrawer />
      </div>
    </div>;
};
var stdin_default = DashboardHeader;
export {
  stdin_default as default
};
