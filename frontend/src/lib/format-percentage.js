const formatPercentage = (value, options = {}) => {
  const { decimalPlaces = 1, showSign = false, isExpense = false } = options;
  if (typeof value !== "number" || isNaN(value)) return "0%";
  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "percent",
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(absValue / 100);
  if (!showSign) return formatted;
  if (isExpense) {
    return value <= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
};
export {
  formatPercentage
};
