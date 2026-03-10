export const DEFAULT_BRAND_NAME = "ZOOP";

export const normalizeBrandName = (value) => {
  const normalized = String(value || "").trim();
  return normalized || DEFAULT_BRAND_NAME;
};

const applyMatchCase = (match, replacement) => {
  const normalizedReplacement = normalizeBrandName(replacement);
  if (match === match.toUpperCase()) {
    return normalizedReplacement.toUpperCase();
  }
  if (match === match.toLowerCase()) {
    return normalizedReplacement.toLowerCase();
  }
  if (
    match.charAt(0) === match.charAt(0).toUpperCase() &&
    match.slice(1) === match.slice(1).toLowerCase()
  ) {
    return (
      normalizedReplacement.charAt(0).toUpperCase() +
      normalizedReplacement.slice(1).toLowerCase()
    );
  }
  return normalizedReplacement;
};

export const replaceBrandTokens = (value, brandName = DEFAULT_BRAND_NAME) => {
  if (typeof value !== "string") return value;
  return value.replace(/\bzoop\b/gi, (match) => applyMatchCase(match, brandName));
};

export const replaceBrandTokensDeep = (
  value,
  brandName = DEFAULT_BRAND_NAME,
) => {
  if (typeof value === "string") {
    return replaceBrandTokens(value, brandName);
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceBrandTokensDeep(item, brandName));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, item]) => {
      acc[key] = replaceBrandTokensDeep(item, brandName);
      return acc;
    }, {});
  }
  return value;
};
