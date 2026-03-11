const hasValue = (value) =>
  Array.isArray(value) ? value.length > 0 : String(value || "").trim().length > 0;

export const getMissingCustomerProfileFields = (profile = {}) => {
  const missing = [];
  if (!(profile.displayName || profile.name)) missing.push("name");
  // if (!profile.email) missing.push("email"); // Removed email constraint
  if (!hasValue(profile.phone)) missing.push("phone");
  if (!hasValue(profile.address)) missing.push("address");
  if (!hasValue(profile.city)) missing.push("city");
  if (!hasValue(profile.state)) missing.push("state");
  if (!hasValue(profile.pincode)) missing.push("pincode");
  return missing;
};

export const getMissingSellerProfileFields = (profile = {}) =>
  [
    "businessName",
    "businessType",
    "panNumber",
    "phone",
    "address",
    "bankName",
    "accountNumber",
    "ifscCode",
    "panCardUrl",
    "cancelledChequeUrl",
  ].filter((field) => !hasValue(profile?.[field]));

export const getMissingProfileFields = (role = "customer", profile = {}) => {
  if (role === "admin") return [];
  return role === "seller"
    ? getMissingSellerProfileFields(profile)
    : getMissingCustomerProfileFields(profile);
};

export const getProfileSetupRoute = (role = "customer") =>
  role === "seller" ? "/seller/onboarding" : "/complete-profile";

export const buildClientProfileState = (profile = {}) => {
  const role = String(profile?.role || "customer");
  const missingFields = getMissingProfileFields(role, profile);
  const explicitComplete = profile?.isProfileComplete;
  const isProfileComplete =
    typeof explicitComplete === "boolean"
      ? explicitComplete
      : missingFields.length === 0;
  const explicitState = String(
    profile?.accountState || profile?.status || "",
  ).toLowerCase();
  const accountState = profile?.isDeleted
    ? "deleted"
    : profile?.disabled || explicitState === "banned"
      ? "banned"
      : explicitState === "pending" || !isProfileComplete
        ? "pending"
        : "active";

  return {
    missingFields,
    isProfileComplete,
    profileNeedsSetup:
      accountState !== "deleted" && accountState !== "banned" && !isProfileComplete,
    profileSetupRoute: getProfileSetupRoute(role),
    accountState,
  };
};
