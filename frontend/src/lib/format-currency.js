const formatCurrency = (value, options = {}) => {
  const { currency = "INR", decimalPlaces = 2, compact = false, showSign = false, isExpense = false } = options;
  const displayValue = isExpense ? -Math.abs(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    notation: compact ? "compact" : "standard",
    //signDisplay: showSign  ? 'always' : isExpense ? 'always' : 'auto',
    signDisplay: showSign ? "always" : "auto"
  }).format(displayValue);
};
export {
  formatCurrency
};
