import { useState, useEffect } from "react";

/**
 * NetworkStatusToast - Shows a toast banner whenever the user goes offline
 * and a success banner when they come back online.
 */
const NetworkStatusToast = () => {
  const [status, setStatus] = useState("online"); // 'online' | 'offline' | 'back-online'
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setStatus("offline");
      setVisible(true);
    };

    const handleOnline = () => {
      setStatus("back-online");
      setVisible(true);
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Check initial state
    if (!navigator.onLine) {
      setStatus("offline");
      setVisible(true);
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
    >
      {status === "offline" && (
        <div className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white rounded-2xl shadow-2xl border border-red-500 max-w-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse flex-shrink-0" />
          <div>
            <p className="font-black text-sm">No Internet Connection</p>
            <p className="text-xs text-red-200 mt-0.5">
              Please check your network and try again
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="ml-auto text-red-200 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {status === "back-online" && (
        <div className="flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-2xl shadow-2xl border border-green-500 max-w-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-white flex-shrink-0" />
          <div>
            <p className="font-black text-sm">Back Online!</p>
            <p className="text-xs text-green-200 mt-0.5">
              Your connection has been restored
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkStatusToast;
