import { useTypedSelector } from "@/app/hook";
import DashboardHeader from "./_component/dashboard-header";
import DashboardStats from "./_component/dashboard-stats";
const DashboardSummary = ({
  dateRange,
  setDateRange
}) => {
  const { user } = useTypedSelector((state) => state.auth);
  return <div className="w-full">
      <DashboardHeader
    title={`Welcome back, ${user?.name || "Unknow"}`}
    subtitle="This is your overview report for the selected period"
    dateRange={dateRange}
    setDateRange={setDateRange}
  />
      <DashboardStats dateRange={dateRange} />
    </div>;
};
var stdin_default = DashboardSummary;
export {
  stdin_default as default
};
