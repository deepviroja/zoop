import { City, Country, State } from "country-state-city";

export const getAllCountries = () => Country.getAllCountries();

export const getCountryByCode = (countryCode = "") =>
  Country.getCountryByCode(String(countryCode || "").toUpperCase()) || null;

export const getStatesOfCountry = (countryCode = "") =>
  State.getStatesOfCountry(String(countryCode || "").toUpperCase()) || [];

export const getStateByCodeAndCountry = (stateCode = "", countryCode = "") =>
  getStatesOfCountry(countryCode).find(
    (item) => item.isoCode === String(stateCode || "").toUpperCase(),
  ) || null;

export const getCitiesOfState = (countryCode = "", stateCode = "") =>
  City.getCitiesOfState(
    String(countryCode || "").toUpperCase(),
    String(stateCode || "").toUpperCase(),
  ) || [];

export const getCitiesOfCountry = (countryCode = "") =>
  City.getCitiesOfCountry(String(countryCode || "").toUpperCase()) || [];

export const getAllCities = () => City.getAllCities() || [];
