import { normalizeCityName } from "./cityMapping";

const DEFAULT_CUTOFF_HOUR = 18;
const DEFAULT_SAME_DAY_HOURS = 4;

const normalizeCity = (value) =>
  normalizeCityName(String(value || "").trim()).toLowerCase();

export const isSameCityDelivery = (product, userCity) => {
  if (!product?.isSameDayEligible) return false;
  const normalizedUserCity = normalizeCity(userCity);
  return Array.isArray(product?.cityAvailability)
    ? product.cityAvailability.some(
        (city) => normalizeCity(city) === normalizedUserCity,
      )
    : false;
};

export const getDeliveryEstimate = (
  product,
  userCity,
  options = {},
) => {
  const fallback = String(product?.deliveryTime || "").trim();
  if (!product) {
    return {
      label: fallback || "Delivery estimate unavailable",
      isSameDay: false,
      isNextDay: false,
    };
  }

  const sameCity = isSameCityDelivery(product, userCity);
  if (!sameCity) {
    return {
      label: fallback || (product?.type === "Local" ? "Fast local delivery" : "2-3 business days"),
      isSameDay: false,
      isNextDay: false,
    };
  }

  const sameDayHours = Math.max(
    1,
    Number(
      options.sameDayHours ??
        product?.seller?.sameDayDeliveryWindowHours ??
        DEFAULT_SAME_DAY_HOURS,
    ) || DEFAULT_SAME_DAY_HOURS,
  );
  const cutoffHour = Math.max(
    0,
    Math.min(
      23,
      Number(
        options.cutoffHour ??
          product?.seller?.sameDayCutoffHour ??
          DEFAULT_CUTOFF_HOUR,
      ) || DEFAULT_CUTOFF_HOUR,
    ),
  );
  const currentHour = Number(options.currentHour ?? new Date().getHours());
  const beforeCutoff = currentHour < cutoffHour;

  if (beforeCutoff) {
    return {
      label:
        sameDayHours <= 6
          ? `Delivery in ${sameDayHours}-${sameDayHours + 1} hours`
          : "Same-day delivery",
      isSameDay: true,
      isNextDay: false,
      cutoffHour,
    };
  }

  return {
    label: "Next-day delivery",
    isSameDay: false,
    isNextDay: true,
    cutoffHour,
  };
};
