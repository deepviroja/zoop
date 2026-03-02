import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  // Determine smart redirect destination
  const getHomeDestination = () => {
    const path = location.pathname;
    // If user is in admin panel routes
    if (path.startsWith("/admin") || user?.role === "admin") {
      return "/admin";
    }
    // If user is in seller panel routes
    if (path.startsWith("/seller") || user?.role === "seller") {
      return "/seller";
    }
    return "/";
  };

  const homeLabel =
    user?.role === "admin"
      ? "Go to Admin Dashboard"
      : user?.role === "seller"
        ? "Go to Seller Dashboard"
        : "Return to Hub";

  const destination = getHomeDestination();

  return (
    <div className="min-h-screen bg-zoop-canvas flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-700">
        <h1 className="text-9xl font-900 text-zoop-obsidian tracking-tighter italic opacity-10">
          404
        </h1>
        <div className="relative -mt-20">
          <h2 className="text-4xl font-900 text-zoop-obsidian uppercase tracking-tighter italic">
            Not_Found
          </h2>
          <p className="text-gray-400 font-bold mt-4 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(destination)}
            className="inline-block bg-zoop-obsidian text-zoop-moss px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-zoop-moss/20"
          >
            {homeLabel}
          </button>
          {destination !== "/" && (
            <button
              onClick={() => navigate("/")}
              className="inline-block bg-white text-gray-600 border border-gray-200 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
            >
              Go to Marketplace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
