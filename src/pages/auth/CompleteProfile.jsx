import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import CountryPhoneField from "../../components/common/CountryPhoneField";
import CountryStateCityFieldset from "../../components/common/CountryStateCityFieldset";
import Seo from "../../components/shared/Seo";
import { useToast } from "../../context/ToastContext";
import { useUser } from "../../context/UserContext";
import { authApi } from "../../services/api";
import { useSiteConfig } from "../../context/SiteConfigContext";
import {
  getCountryByCode,
  getStateByCodeAndCountry,
  getStatesOfCountry,
} from "../../utils/locationData";
import {
  getPincodeValidationMessage,
  isValidInternationalPhone,
  isValidPincode,
} from "../../utils/liveValidation";

const CompleteProfile = () => {
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();
  const { brandName, replaceBrandText } = useSiteConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [phoneMeta, setPhoneMeta] = useState({
    dialCode: "91",
    countryCode: "in",
    format: "",
  });
  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
    address: "",
    countryCode: "IN",
    country: "India",
    stateCode: "",
    state: "",
    city: "",
    pincode: "",
  });

  const redirectTo = useMemo(() => {
    const nextPath = location.state?.from || "/";
    return nextPath === "/complete-profile" ? "/" : nextPath;
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await authApi.getProfile();
        if (cancelled) return;

        const nextStateCode = (() => {
          const states = getStatesOfCountry("IN");
          const matched = states.find(
            (item) =>
              item.name.toLowerCase() === String(profile?.state || "").toLowerCase(),
          );
          return matched?.isoCode || "";
        })();

        setFormData({
          displayName:
            profile?.displayName ||
            profile?.name ||
            user?.displayName ||
            user?.name ||
            "",
          phone: profile?.phone || user?.phone || "",
          address: profile?.address || "",
          countryCode: "IN",
          country: "India",
          stateCode: nextStateCode,
          state: profile?.state || "",
          city: profile?.city || "",
          pincode: profile?.pincode || "",
        });
      } catch {
        if (cancelled) return;
        setFormData((prev) => ({
          ...prev,
          displayName: user?.displayName || user?.name || "",
          phone: user?.phone || "",
        }));
      }
    };

    if (user?.uid) {
      void loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "seller") {
    return <Navigate to="/seller/onboarding" replace />;
  }

  if (!user.profileNeedsSetup && redirectTo !== "/complete-profile") {
    return <Navigate to={redirectTo} replace />;
  }

  const validate = () => {
    const nextErrors = {};

    if (!String(formData.displayName || "").trim()) {
      nextErrors.displayName = "Full name is required";
    }
    if (!formData.phone) {
      nextErrors.phone = "Contact number is required";
    } else if (!isValidInternationalPhone(formData.phone, phoneMeta)) {
      nextErrors.phone = "Enter a valid mobile number with country code";
    }
    if (!String(formData.address || "").trim()) {
      nextErrors.address = "Address is required";
    }
    if (!formData.countryCode) {
      nextErrors.country = "Country is required";
    }
    if (!formData.stateCode) {
      nextErrors.state = "State is required";
    }
    if (!String(formData.city || "").trim()) {
      nextErrors.city = "City is required";
    }
    if (!String(formData.pincode || "").trim()) {
      nextErrors.pincode = "Pincode is required";
    } else if (!isValidPincode(formData.pincode, formData.countryCode)) {
      nextErrors.pincode = getPincodeValidationMessage(formData.countryCode);
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      await authApi.updateProfile({
        displayName: formData.displayName.trim(),
        name: formData.displayName.trim(),
        phone: formData.phone,
        address: formData.address.trim(),
        countryCode: formData.countryCode,
        country: formData.country,
        state: formData.state,
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        defaultLocation: formData.city.trim(),
      });
      await refreshUser({
        suppressMissingProfileToast: true,
        suppressIncompleteProfileToast: true,
      });
      showToast("Profile created successfully", "success");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      showToast(error?.message || "Could not save your profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Seo
        title={`Complete Profile | ${brandName}`}
        description={replaceBrandText(
          "Finish your required account details before entering the Zoop marketplace.",
        )}
        robots="noindex,nofollow"
        canonicalPath="/complete-profile"
      />
      <div className="rounded-[1.75rem] bg-gradient-to-br from-zoop-moss/15 via-white to-zoop-copper/10 p-3 sm:p-4">
        <div className="w-full max-w-xl">
          <div className="rounded-[1.75rem] bg-white dark:glass-card p-5 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] sm:p-8">
            <div className="mb-8 text-center">
              <Link
                to="/"
                className="inline-block text-3xl font-black text-zoop-moss"
              >
                {brandName}
              </Link>
              <h1 className="mt-4 text-2xl font-black text-zoop-obsidian dark:text-white">
                Complete Your Profile
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {replaceBrandText(
                  "Your account is active in Firebase Auth, but the Zoop marketplace stays locked until your profile is saved.",
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition-all ${
                    errors.displayName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 dark:border-white/10 focus:border-zoop-moss"
                  }`}
                  placeholder="John Doe"
                />
                {errors.displayName && (
                  <p className="mt-1 text-xs font-bold text-red-500">
                    {errors.displayName}
                  </p>
                )}
              </div>

              <CountryPhoneField
                label="Contact Number"
                required
                value={formData.phone}
                onChange={(value, countryData) => {
                  setPhoneMeta(countryData || phoneMeta);
                  setFormData((prev) => ({ ...prev, phone: value }));
                }}
                onMetaChange={(meta) => setPhoneMeta(meta || phoneMeta)}
                error={errors.phone}
                defaultCountry="in"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  rows={3}
                  className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition-all ${
                    errors.address
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 dark:border-white/10 focus:border-zoop-moss"
                  }`}
                  placeholder="House No, Street, Area"
                />
                {errors.address && (
                  <p className="mt-1 text-xs font-bold text-red-500">
                    {errors.address}
                  </p>
                )}
              </div>

              <CountryStateCityFieldset
                country={formData.countryCode}
                state={formData.stateCode}
                city={formData.city}
                required
                errors={{
                  country: errors.country,
                  state: errors.state,
                  city: errors.city,
                }}
                onCountryChange={(countryCode) => {
                  const country = getCountryByCode(countryCode);
                  setFormData((prev) => ({
                    ...prev,
                    countryCode,
                    country: country?.name || "",
                    stateCode: "",
                    state: "",
                    city: "",
                  }));
                }}
                onStateChange={(stateCode) => {
                  const selectedState = getStateByCodeAndCountry(
                    stateCode,
                    formData.countryCode,
                  );
                  setFormData((prev) => ({
                    ...prev,
                    stateCode,
                    state: selectedState?.name || "",
                    city: "",
                  }));
                }}
                onCityChange={(city) =>
                  setFormData((prev) => ({ ...prev, city }))
                }
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Pincode
                </label>
                <input
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pincode: e.target.value,
                    }))
                  }
                  className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition-all ${
                    errors.pincode
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 dark:border-white/10 focus:border-zoop-moss"
                  }`}
                  placeholder="395003"
                />
                {errors.pincode && (
                  <p className="mt-1 text-xs font-bold text-red-500">
                    {errors.pincode}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-xl bg-zoop-obsidian py-3.5 text-sm font-black uppercase tracking-wider text-white transition-all hover:bg-zoop-moss hover:text-zoop-obsidian disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save And Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompleteProfile;
