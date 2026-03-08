import React from 'react';
import { useUser } from '../../context/UserContext';

interface Props {
  children: React.ReactNode;
  allowedRoles?: ('customer' | 'seller' | 'admin')[];
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles, adminOnly }) => {
  const { user, isLoading } = useUser();
  const isSellerOnlyRoute =
    Array.isArray(allowedRoles) &&
    allowedRoles.length === 1 &&
    allowedRoles[0] === "seller";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zoop-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show message instead of redirect
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border-2 border-zoop-moss/20">
          <div className="w-20 h-20 bg-zoop-moss/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-2xl font-black text-zoop-obsidian mb-4 uppercase italic">Access Required</h2>
          <p className="text-gray-500 mb-8 font-bold">Please log in to your account to access this page.</p>
          <div className="flex flex-col gap-3">
             <button 
                onClick={() => window.location.href = adminOnly ? "/admin/login" : "/login"}
                className="w-full py-4 bg-zoop-obsidian text-white rounded-xl font-black uppercase tracking-widest hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
             >
               Go to Login
             </button>
             <button 
                onClick={() => window.location.href = "/"}
                className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
             >
               Return Home
             </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but wrong role
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    if (isSellerOnlyRoute) {
      const isCustomer = user.role === "customer";
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border-2 border-amber-100">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏪</span>
            </div>
            <h2 className="text-2xl font-black text-zoop-obsidian mb-4 uppercase italic">Seller Access Only</h2>
            <p className="text-gray-600 mb-3 font-bold">
              This section is available only for seller accounts.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              {isCustomer
                ? "If you want to use the seller dashboard, create a seller account with a different email."
                : "Use an approved seller account to continue."}
            </p>
            <div className="flex flex-col gap-3">
              {isCustomer && (
                <button
                  onClick={() => window.location.href = "/seller/signup"}
                  className="w-full py-4 bg-zoop-obsidian text-white rounded-xl font-black uppercase tracking-widest hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
                >
                  Create Seller Account
                </button>
              )}
              <button
                onClick={() => window.location.href = "/"}
                className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border-2 border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🚫</span>
            </div>
            <h2 className="text-2xl font-black text-red-600 mb-4 uppercase italic">Unauthorized</h2>
            <p className="text-gray-600 mb-8 font-bold">Your account does not have permission to view this content.</p>
            <button 
                onClick={() => window.location.href = "/"}
                className="w-full py-4 bg-zoop-obsidian text-white rounded-xl font-black uppercase tracking-widest hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
            >
              Back to Safety
            </button>
          </div>
        </div>
      );
  }

  return <>{children}</>;
};
