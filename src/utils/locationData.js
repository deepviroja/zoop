export const COUNTRIES = [
  { isoCode: "IN", name: "India" },
  { isoCode: "AE", name: "United Arab Emirates" },
  { isoCode: "AU", name: "Australia" },
  { isoCode: "CA", name: "Canada" },
  { isoCode: "GB", name: "United Kingdom" },
  { isoCode: "SG", name: "Singapore" },
  { isoCode: "US", name: "United States" },
];

const INDIA_STATES = [
  { isoCode: "AN", name: "Andaman and Nicobar Islands" },
  { isoCode: "AP", name: "Andhra Pradesh" },
  { isoCode: "AR", name: "Arunachal Pradesh" },
  { isoCode: "AS", name: "Assam" },
  { isoCode: "BR", name: "Bihar" },
  { isoCode: "CG", name: "Chhattisgarh" },
  { isoCode: "CH", name: "Chandigarh" },
  { isoCode: "DH", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { isoCode: "DL", name: "Delhi" },
  { isoCode: "GA", name: "Goa" },
  { isoCode: "GJ", name: "Gujarat" },
  { isoCode: "HP", name: "Himachal Pradesh" },
  { isoCode: "HR", name: "Haryana" },
  { isoCode: "JH", name: "Jharkhand" },
  { isoCode: "JK", name: "Jammu and Kashmir" },
  { isoCode: "KA", name: "Karnataka" },
  { isoCode: "KL", name: "Kerala" },
  { isoCode: "LA", name: "Ladakh" },
  { isoCode: "LD", name: "Lakshadweep" },
  { isoCode: "MH", name: "Maharashtra" },
  { isoCode: "ML", name: "Meghalaya" },
  { isoCode: "MN", name: "Manipur" },
  { isoCode: "MP", name: "Madhya Pradesh" },
  { isoCode: "MZ", name: "Mizoram" },
  { isoCode: "NL", name: "Nagaland" },
  { isoCode: "OD", name: "Odisha" },
  { isoCode: "PB", name: "Punjab" },
  { isoCode: "PY", name: "Puducherry" },
  { isoCode: "RJ", name: "Rajasthan" },
  { isoCode: "SK", name: "Sikkim" },
  { isoCode: "TN", name: "Tamil Nadu" },
  { isoCode: "TS", name: "Telangana" },
  { isoCode: "TR", name: "Tripura" },
  { isoCode: "UK", name: "Uttarakhand" },
  { isoCode: "UP", name: "Uttar Pradesh" },
  { isoCode: "WB", name: "West Bengal" },
];

const STATES_BY_COUNTRY = {
  IN: INDIA_STATES,
};

export const getAllCountries = () => COUNTRIES;

export const getCountryByCode = (countryCode = "") =>
  COUNTRIES.find((item) => item.isoCode === String(countryCode || "").toUpperCase()) || null;

export const getStatesOfCountry = (countryCode = "") =>
  STATES_BY_COUNTRY[String(countryCode || "").toUpperCase()] || [];

export const getStateByCodeAndCountry = (stateCode = "", countryCode = "") =>
  getStatesOfCountry(countryCode).find(
    (item) => item.isoCode === String(stateCode || "").toUpperCase(),
  ) || null;
