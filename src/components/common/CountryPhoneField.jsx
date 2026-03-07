import React from "react";
import PhoneInput from "react-country-phone-input";
import "react-country-phone-input/lib/style.css";

const normalizePhoneValue = (rawValue = "", countryData = {}) => {
  const digits = String(rawValue || "").replace(/\D/g, "");
  const dialCode = String(countryData?.dialCode || "").replace(/\D/g, "");
  if (!digits) return "";
  const localDigits = dialCode && digits.startsWith(dialCode)
    ? digits.slice(dialCode.length)
    : digits;
  return dialCode ? `+${dialCode}${localDigits}` : `+${digits}`;
};

const CountryPhoneField = ({
  label = "Phone Number",
  value = "",
  onChange,
  onMetaChange,
  error = "",
  required = false,
  disabled = false,
  placeholder = "Enter phone number",
  defaultCountry = "in",
  inputName = "phone",
}) => {
  return (
    <div className="relative">
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label} {required ? "*" : ""}
      </label>
      <PhoneInput
        country={defaultCountry}
        value={value}
        disabled={disabled}
        enableSearch
        preferredCountries={["in", "us", "gb", "ae"]}
        countryCodeEditable={false}
        placeholder={placeholder}
        onChange={(nextValue, countryData) => {
          onMetaChange?.(countryData || {});
          onChange?.(
            normalizePhoneValue(nextValue || "", countryData || {}),
            countryData || {},
          );
        }}
        inputProps={{
          name: inputName,
          required,
        }}
        containerClass="w-full"
        inputClass={`!w-full !h-[50px] !pl-14 !pr-4 !rounded-xl !border-2 !text-sm !font-medium !outline-none ${
          error
            ? "!border-red-500 !bg-red-50"
            : "!border-gray-200 focus:!border-zoop-moss"
        }`}
        buttonClass={`!rounded-l-xl !border-2 !border-r-0 ${
          error ? "!border-red-500 !bg-red-50" : "!border-gray-200 !bg-white"
        }`}
        dropdownClass="!z-[260] !text-sm !mt-2"
        dropdownStyle={{
          top: "calc(100% + 8px)",
          bottom: "auto",
          maxHeight: "260px",
        }}
      />
      {error && <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
    </div>
  );
};

export default CountryPhoneField;
