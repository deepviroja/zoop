export const hasUppercase = (value = "") => /[A-Z]/.test(value);

export const normalizePhoneDigits = (phone = "") => String(phone).replace(/\D/g, "");

export const isValidPhoneLoose = (phone = "") => normalizePhoneDigits(phone).length >= 10;

export const isValidIndianPincode = (value = "") => /^\d{6}$/.test(String(value || ""));

export const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));

const PINCODE_REGEX_MAP = {
  IN: /^\d{6}$/,
  US: /^\d{5}(?:-\d{4})?$/,
  CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
  GB: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
  IT: /^\d{5}$/,
  ES: /^\d{5}$/,
  AE: /^\d{5}$/,
  SG: /^\d{6}$/,
};

export const isValidPincode = (value = "", countryCode = "IN") => {
  const code = String(countryCode || "IN").toUpperCase();
  const raw = String(value || "").trim();
  if (!raw) return false;
  const matcher = PINCODE_REGEX_MAP[code];
  if (matcher) return matcher.test(raw);
  // Generic global fallback: 3-10 alphanumeric with optional space/hyphen.
  return /^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(raw);
};

export const getPincodeValidationMessage = (countryCode = "IN") => {
  const code = String(countryCode || "IN").toUpperCase();
  if (code === "IN") return "Please enter a valid 6-digit pincode";
  return "Please enter a valid postal code for the selected country";
};

const countFormatDigits = (format = "") => (String(format).match(/\./g) || []).length;

const getLocalDigits = (phone = "", dialCode = "") => {
  const digits = normalizePhoneDigits(phone);
  const dc = normalizePhoneDigits(dialCode);
  if (!dc) return digits;
  if (digits.startsWith(dc)) return digits.slice(dc.length);
  return digits;
};

export const isValidInternationalPhone = (phone = "", countryData = {}) => {
  const dialCode = String(countryData?.dialCode || "");
  const localDigits = getLocalDigits(phone, dialCode);
  const formatDigitCount = countFormatDigits(countryData?.format || "");
  const dialDigits = normalizePhoneDigits(dialCode).length;
  const expectedLocalDigits =
    formatDigitCount > dialDigits ? formatDigitCount - dialDigits : 0;

  if (expectedLocalDigits > 0) {
    return localDigits.length === expectedLocalDigits;
  }

  // E.164 max 15 digits, minimum practical local length 6 digits.
  return localDigits.length >= 6 && localDigits.length <= 15;
};
