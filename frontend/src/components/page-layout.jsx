import { cn } from "@/lib/utils";
import PageHeader from "./page-header";
const PageLayout = ({
  children,
  className,
  title,
  subtitle,
  rightAction,
  showHeader = true,
  addMarginTop = false,
  renderPageHeader
}) => {
  return <div>
      {showHeader && <PageHeader
    title={title}
    subtitle={subtitle}
    rightAction={rightAction}
    renderPageHeader={renderPageHeader}
  />}
    <div className={cn(
    "w-full max-w-[var(--max-width)] mx-auto pt-8",
    addMarginTop && "-mt-20",
    className
  )}>
      {children}
    </div>
    </div>;
};
var stdin_default = PageLayout;
export {
  stdin_default as default
};
