export const formatInr = (value, options = {}) => {
  const amount = Number(value || 0);
  const {
    maximumFractionDigits = 2,
    minimumFractionDigits = 0,
    compact = false,
  } = options;

  return amount.toLocaleString("en-IN", {
    notation: compact ? "compact" : "standard",
    compactDisplay: compact ? "short" : undefined,
    maximumFractionDigits,
    minimumFractionDigits,
  });
};

export const formatInrWithSymbol = (value, options = {}) =>
  `₹${formatInr(value, options)}`;
