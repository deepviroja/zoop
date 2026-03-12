import React, { useMemo } from "react";
import {
  getAllCountries,
  getCitiesOfState,
  getStatesOfCountry,
} from "../../utils/locationData";

const CountryStateCityFieldset = ({
  country = "",
  state = "",
  city = "",
  onCountryChange,
  onStateChange,
  onCityChange,
  errors = {},
  required = false,
}) => {
  const countries = useMemo(() => getAllCountries(), []);
  const states = useMemo(() => {
    if (!country) return [];
    return getStatesOfCountry(country);
  }, [country]);
  const cities = useMemo(() => {
    if (!country || !state) return [];
    return getCitiesOfState(country, state);
  }, [country, state]);
  const countryId = "country-field";
  const stateId = "state-field";
  const cityId = "city-field";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 relative z-10">
      <div className="space-y-2 group">
        <label htmlFor={countryId} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 group-focus-within:text-zoop-moss transition-colors px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zoop-moss" />
          Country {required ? "*" : ""}
        </label>
        <div className="relative">
          <select
            id={countryId}
            value={country}
            onChange={(e) => onCountryChange?.(e.target.value)}
            aria-label="Country"
            className={`w-full appearance-none bg-white dark:bg-white/5 px-5 py-4 rounded-[1.25rem] border-2 outline-none transition-all pr-12 focus:shadow-[0_0_20px_rgba(163,230,53,0.1)] ${
              errors.country
                ? "border-red-500 bg-red-50"
                : "border-gray-100 dark:border-white/10 focus:border-zoop-moss focus:bg-white dark:focus:bg-white/10"
            }`}
          >
            <option value="">Choose Country</option>
            {countries.map((item) => (
              <option key={item.isoCode} value={item.isoCode} className="dark:bg-zoop-obsidian">
                {item.name}
              </option>
            ))}
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        {errors.country && (
          <p className="text-red-500 text-[10px] px-1 font-black uppercase tracking-wider">{errors.country}</p>
        )}
      </div>

      <div className="space-y-2 group">
        <label htmlFor={stateId} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 group-focus-within:text-zoop-moss transition-colors px-1">
          <span className={`w-1.5 h-1.5 rounded-full ${country ? "bg-zoop-moss" : "bg-gray-300"}`} />
          Province / State {required ? "*" : ""}
        </label>
        <div className="relative">
          {states.length > 0 ? (
            <>
              <select
                id={stateId}
                value={state}
                onChange={(e) => onStateChange?.(e.target.value)}
                disabled={!country}
                aria-label="State"
                className={`w-full appearance-none bg-white dark:bg-white/5 px-5 py-4 rounded-[1.25rem] border-2 outline-none transition-all pr-12 focus:shadow-[0_0_20px_rgba(163,230,53,0.1)] disabled:opacity-40 disabled:cursor-not-allowed ${
                  errors.state
                    ? "border-red-500 bg-red-50"
                    : "border-gray-100 dark:border-white/10 focus:border-zoop-moss focus:bg-white dark:focus:bg-white/10"
                }`}
              >
                <option value="">Choose State</option>
                {states.map((item) => (
                  <option key={item.isoCode} value={item.isoCode} className="dark:bg-zoop-obsidian">
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </>
          ) : (
            <input
              id={stateId}
              type="text"
              value={state}
              onChange={(e) => onStateChange?.(e.target.value)}
              disabled={!country}
              placeholder="Enter state name"
              className={`w-full bg-white dark:bg-white/5 px-5 py-4 rounded-[1.25rem] border-2 outline-none transition-all focus:shadow-[0_0_20px_rgba(163,230,53,0.1)] disabled:opacity-40 disabled:cursor-not-allowed ${
                errors.state
                  ? "border-red-500 bg-red-50"
                  : "border-gray-100 dark:border-white/10 focus:border-zoop-moss focus:bg-white dark:focus:bg-white/10"
              }`}
            />
          )}
        </div>
        {errors.state && (
          <p className="text-red-500 text-[10px] px-1 font-black uppercase tracking-wider">{errors.state}</p>
        )}
      </div>

      <div className="space-y-2 group">
        <label htmlFor={cityId} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 group-focus-within:text-zoop-moss transition-colors px-1">
          <span className={`w-1.5 h-1.5 rounded-full ${state ? "bg-zoop-moss" : "bg-gray-300"}`} />
          District / City {required ? "*" : ""}
        </label>
        <div className="relative">
          {cities.length > 0 ? (
            <>
              <select
                id={cityId}
                value={city}
                onChange={(e) => onCityChange?.(e.target.value)}
                disabled={!country || !state}
                aria-label="City"
                className={`w-full appearance-none bg-white dark:bg-white/5 px-5 py-4 rounded-[1.25rem] border-2 outline-none transition-all pr-12 focus:shadow-[0_0_20px_rgba(163,230,53,0.1)] disabled:opacity-40 disabled:cursor-not-allowed ${
                  errors.city
                    ? "border-red-500 bg-red-50"
                    : "border-gray-100 dark:border-white/10 focus:border-zoop-moss focus:bg-white dark:focus:bg-white/10"
                }`}
              >
                <option value="">Choose City</option>
                {cities.map((item) => (
                  <option key={item.name} value={item.name} className="dark:bg-zoop-obsidian">
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </>
          ) : (
            <input
              id={cityId}
              type="text"
              value={city}
              onChange={(e) => onCityChange?.(e.target.value)}
              disabled={!country || !state}
              placeholder="Enter city name"
              className={`w-full bg-white dark:bg-white/5 px-5 py-4 rounded-[1.25rem] border-2 outline-none transition-all focus:shadow-[0_0_20px_rgba(163,230,53,0.1)] disabled:opacity-40 disabled:cursor-not-allowed ${
                errors.city
                  ? "border-red-500 bg-red-50"
                  : "border-gray-100 dark:border-white/10 focus:border-zoop-moss focus:bg-white dark:focus:bg-white/10"
              }`}
            />
          )}
        </div>
        {errors.city && (
          <p className="text-red-500 text-[10px] px-1 font-black uppercase tracking-wider">{errors.city}</p>
        )}
      </div>
    </div>
  );
};

export default CountryStateCityFieldset;
