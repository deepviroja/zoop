import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useSiteConfig } from "../../context/SiteConfigContext";

const AuthLayout = () => {
  const { brandName, replaceBrandText } = useSiteConfig();
  return (
    <div className="min-h-screen bg-white md:h-screen md:overflow-hidden">
      <div className="flex min-h-screen flex-col md:h-screen md:flex-row">
      {/* --- LEFT SIDE: THE VIBE (Hidden on Mobile) --- */}
      <div className="hidden md:flex md:sticky md:top-0 md:h-screen md:w-1/2 bg-zoop-obsidian p-12 flex-col justify-between relative overflow-hidden">
        {/* Logo */}
        <Link
          to="/"
          className="text-3xl font-900 tracking-tighter text-zoop-moss z-10"
        >
          {brandName}
          <span className="text-white text-xs align-top ml-1 font-normal italic">
            .in
          </span>
        </Link>

        {/* Brand Message */}
        <div className="z-10">
          <h1 className="text-5xl font-900 text-white leading-tight">
            Local speed. <br />
            <span className="text-zoop-moss">National reach.</span>
          </h1>
          <p className="text-white/60 mt-6 text-lg max-w-md">
            Join the marketplace where Surat’s best artisans meet India’s
            biggest brands. Same-day delivery, zero compromise.
          </p>
        </div>

        {/* Footer info */}
        <div className="z-10 text-white/40 text-sm font-medium">
          {replaceBrandText("© 2026 Zoop Marketplace Global.")}
        </div>

        {/* Decorative Kinetic Circles */}
        <div className="absolute -right-20 top-20 w-96 h-96 bg-zoop-moss opacity-10 blur-3xl rounded-full"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-zoop-copper opacity-20 blur-3xl rounded-full"></div>
      </div>

      {/* --- RIGHT SIDE: THE FORM --- */}
      <div className="flex min-h-screen flex-1 flex-col md:h-screen md:min-h-0 md:overflow-hidden">
        {/* Mobile Logo Only */}
        <div className="md:hidden p-6 bg-zoop-obsidian">
          <Link
            to="/"
            className="text-2xl font-900 tracking-tighter text-zoop-moss"
          >
            {brandName}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-6 sm:p-8 md:p-12 lg:p-16">
            <div className="w-full max-w-md space-y-8 py-2 md:py-6">
            <Outlet />

            {/* Global Auth Footer */}
            <div className="pt-8 border-t border-gray-100">
              <p className="text-center text-xs text-gray-400">
                {replaceBrandText("By continuing, you agree to Zoop's")}
                <span className="text-zoop-obsidian font-bold underline px-1 cursor-pointer">
                  Terms of Service
                </span>
                and
                <span className="text-zoop-obsidian font-bold underline px-1 cursor-pointer">
                  Privacy Policy
                </span>
                .
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AuthLayout;
