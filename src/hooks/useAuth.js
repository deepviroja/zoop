import { useUser } from "../context/UserContext";

export const useAuth = () => {
  const { user, isLoading, ...rest } = useUser();

  return {
    user,
    loading: isLoading,
    isAuthenticated: Boolean(user),
    hasProfileDocument: Boolean(user?.hasProfileDocument),
    isProfileComplete: Boolean(user?.isProfileComplete),
    needsProfileCompletion: Boolean(user?.profileNeedsSetup),
    profileSetupRoute: user?.profileSetupRoute || "/complete-profile",
    ...rest,
  };
};
