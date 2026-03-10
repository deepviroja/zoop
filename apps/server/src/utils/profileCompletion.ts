const hasValue = (value: any) =>
  Array.isArray(value) ? value.length > 0 : String(value || "").trim().length > 0;

export const getMissingCustomerProfileFields = (profile: Record<string, any> = {}) => {
  const missing: string[] = [];
  if (!(profile.displayName || profile.name)) missing.push('name');
  if (!profile.email) missing.push('email');
  if (!hasValue(profile.phone)) missing.push('phone');
  if (!hasValue(profile.address)) missing.push('address');
  if (!hasValue(profile.city)) missing.push('city');
  if (!hasValue(profile.state)) missing.push('state');
  if (!hasValue(profile.pincode)) missing.push('pincode');
  return missing;
};

export const getMissingSellerProfileFields = (profile: Record<string, any> = {}) =>
  [
    'businessName',
    'businessType',
    'panNumber',
    'phone',
    'address',
    'bankName',
    'accountNumber',
    'ifscCode',
    'panCardUrl',
    'cancelledChequeUrl',
  ].filter((field) => !hasValue(profile?.[field]));

export const getMissingProfileFields = (
  role: string,
  profile: Record<string, any> = {},
) => {
  if (role === 'admin') return [];
  return role === 'seller'
    ? getMissingSellerProfileFields(profile)
    : getMissingCustomerProfileFields(profile);
};

export const buildProfileCompletionState = (
  role: string,
  profile: Record<string, any> = {},
) => {
  const missingFields = getMissingProfileFields(role, profile);
  const isProfileComplete =
    typeof profile?.isProfileComplete === 'boolean'
      ? profile.isProfileComplete
      : missingFields.length === 0;

  return {
    isProfileComplete,
    profileMissingFields: missingFields,
    status: isProfileComplete ? 'active' : 'pending',
    accountState: isProfileComplete ? 'active' : 'pending',
  };
};

export const isPendingProfile = (profile: Record<string, any> = {}) =>
  profile?.accountState === 'pending' ||
  profile?.status === 'pending' ||
  profile?.isProfileComplete === false;
