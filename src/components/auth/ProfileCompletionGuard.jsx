import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import Loader from "../ui/Loader";

const ProfileCompletionGuard = () => {
  const { user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (!user?.profileNeedsSetup) {
    return <Outlet />;
  }

  const setupRoute = user.profileSetupRoute || "/complete-profile";
  const currentPath = location.pathname;
  const isAllowedPath =
    currentPath === setupRoute ||
    (user.role === "seller" &&
      (currentPath === "/seller/onboarding" || currentPath === "/seller/waiting"));

  if (isAllowedPath) {
    return <Outlet />;
  }

  return (
    <Navigate
      to={setupRoute}
      replace
      state={{ from: `${location.pathname}${location.search}` }}
    />
  );
};

export default ProfileCompletionGuard;
