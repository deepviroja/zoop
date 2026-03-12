import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "../../assets/icons/Shield";
import { useUser } from "../../context/UserContext";

const SellerApprovalWaiting = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [checkCount, setCheckCount] = useState(0);

  // Auto-poll: if admin approves seller, redirect to seller panel
  useEffect(() => {
    if (!user) return;

    // If seller is approved, redirect to dashboard
    if (user.verificationStatus === "approved") {
      navigate("/seller/dashboard", { replace: true });
      return;
    }

    // Poll every 30s to check approval status
    const timer = setInterval(() => {
      setCheckCount((c) => c + 1);
      // Force a page reload to get fresh user status from Firebase
      // The UserProvider will auto-refresh via onAuthStateChanged on component mount
    }, 30000);

    return () => clearInterval(timer);
  }, [user, navigate, checkCount]);

  const isRejected = user?.verificationStatus === "rejected";

  return (
    <div className="min-h-screen bg-zoop-canvas flex items-center justify-center p-4">
      <div className="bg-white dark:glass-card max-w-xl w-full rounded-[3rem] p-10 md:p-14 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] text-center space-y-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-400/10 blur-[100px] rounded-full" />

        <div className="relative">
          <div
            className={`w-24 h-24 bg-gradient-to-br rounded-[2rem] flex items-center justify-center mx-auto shadow-inner mb-8 ${
              isRejected
                ? "from-red-50 to-red-100 border border-red-200/50"
                : "from-amber-50 to-amber-100 border border-amber-200/50"
            }`}
          >
            <Shield
              width={48}
              height={48}
              className={isRejected ? "text-red-500" : "text-amber-600"}
            />
          </div>

          <h1
            className={`text-4xl font-900 italic tracking-tighter uppercase mb-4 ${
              isRejected ? "text-red-600" : "text-zoop-obsidian dark:text-white"
            }`}
          >
            {isRejected ? "Application_Rejected" : "Under_Review"}
          </h1>

          <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-sm mx-auto">
            {isRejected
              ? "Unfortunately, your seller application was not approved at this time. You can reapply with updated information."
              : "Our curators are currently verifying your business credentials. We'll notify you as soon as your shop is ready."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div
            className={`p-6 rounded-3xl text-left border relative group transition-all ${
              isRejected
                ? "bg-red-50/50 border-red-100 hover:bg-red-50"
                : "bg-amber-50/50 border-amber-100 hover:bg-amber-50"
            }`}
          >
            <p
              className={`text-[10px] font-black uppercase tracking-widest mb-3 ${
                isRejected ? "text-red-500" : "text-amber-600"
              }`}
            >
              Application_Status
            </p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isRejected ? "bg-red-400" : "bg-amber-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isRejected ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                </span>
              </div>
              <span className="font-black text-zoop-obsidian dark:text-white uppercase text-sm tracking-tight">
                {isRejected ? "Rejected_" : "Pending Approval_"}
              </span>
            </div>
          </div>

          <div className="bg-zoop-obsidian p-6 rounded-3xl text-left border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
              <Shield width={40} height={40} className="text-white" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
              {isRejected ? "Next_Step" : "Estimated_Wait"}
            </p>
            <p className="font-black text-white uppercase text-sm tracking-tight">
              {isRejected ? "Contact Support_" : "24-48 Hours_"}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {/* Primary action */}
          <Link
            to="/"
            className="block w-full bg-zoop-obsidian text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-zoop-moss hover:text-zoop-obsidian hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] shadow-zoop-obsidian/20"
          >
            Return to Marketplace
          </Link>

          {/* Contact support */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Need help? Contact{" "}
            <a
              href="mailto:partners@zoop.com"
              className="text-zoop-obsidian dark:text-white hover:underline"
            >
              partners@zoop.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerApprovalWaiting;
