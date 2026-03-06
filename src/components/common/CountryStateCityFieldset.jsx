import React, { useMemo } from "react";
import { getAllCountries, getStatesOfCountry } from "../../utils/locationData";

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 relative z-10">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Country {required ? "*" : ""}
        </label>
        <select
          value={country}
          onChange={(e) => onCountryChange?.(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all mt-1 ${
            errors.country
              ? "border-red-500 bg-red-50"
              : "border-gray-200 focus:border-zoop-moss"
          }`}
        >
          <option value="">Select Country</option>
          {countries.map((item) => (
            <option key={item.isoCode} value={item.isoCode}>
              {item.name}
            </option>
          ))}
        </select>
        {errors.country && (
          <p className="text-red-500 text-xs mt-1 font-bold">{errors.country}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          State {required ? "*" : ""}
        </label>
        {states.length > 0 ? (
          <select
            value={state}
            onChange={(e) => onStateChange?.(e.target.value)}
            disabled={!country}
            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.state
                ? "border-red-500 bg-red-50"
                : "border-gray-200 focus:border-zoop-moss"
            }`}
          >
            <option value="">Select State</option>
            {states.map((item) => (
              <option key={item.isoCode} value={item.isoCode}>
                {item.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={state}
            onChange={(e) => onStateChange?.(e.target.value)}
            disabled={!country}
            placeholder="Enter state or region"
            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.state
                ? "border-red-500 bg-red-50"
                : "border-gray-200 focus:border-zoop-moss"
            }`}
          />
        )}
        {errors.state && (
          <p className="text-red-500 text-xs mt-1 font-bold">{errors.state}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          City {required ? "*" : ""}
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange?.(e.target.value)}
          disabled={!country || !state}
          placeholder="Enter city"
          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.city
              ? "border-red-500 bg-red-50"
              : "border-gray-200 focus:border-zoop-moss"
          }`}
        />
        {errors.city && (
          <p className="text-red-500 text-xs mt-1 font-bold">{errors.city}</p>
        )}
      </div>
    </div>
  );
};

export default CountryStateCityFieldset;
