import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { Check } from "../assets/icons/Check";
import { X } from "../assets/icons/X";
import { AlertCircle } from "../assets/icons/AlertCircle";
import { setToastHandler } from "../services/toastService";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", action = null) => {
    setToasts((prev) => {
      // Prevent duplicate messages
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      // Limit to 3 toasts max
      const newToasts = [...prev, { id: Date.now(), message, type, action }];
      if (newToasts.length > 3) {
        return newToasts.slice(newToasts.length - 3);
      }
      return newToasts;
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message, action) => showToast(message, "success", action),
    [showToast],
  );
  const error = useCallback(
    (message, action) => showToast(message, "error", action),
    [showToast],
  );
  const info = useCallback(
    (message, action) => showToast(message, "info", action),
    [showToast],
  );
  const warning = useCallback(
    (message, action) => showToast(message, "warning", action),
    [showToast],
  );

  useEffect(() => {
    setToastHandler({ success, error, info, warning });
  }, [success, error, info, warning]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 400); // Wait for animation
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  const getStyle = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-zoop-obsidian",
          border: "border-zoop-moss",
          iconColor: "text-zoop-moss",
          icon: <Check width={20} height={20} />,
        };
      case "error":
        return {
          bg: "bg-zoop-obsidian",
          border: "border-red-500",
          iconColor: "text-red-500",
          icon: <X width={20} height={20} />,
        };
      case "warning":
        return {
          bg: "bg-zoop-obsidian",
          border: "border-orange-500",
          iconColor: "text-orange-500",
          icon: <AlertCircle width={20} height={20} />,
        };
      default:
        return {
          bg: "bg-zoop-obsidian",
          border: "border-blue-500",
          iconColor: "text-blue-500",
          icon: <AlertCircle width={20} height={20} />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center gap-4 min-w-[320px] max-w-sm p-4 rounded-xl shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] border-l-[6px]
        backdrop-blur-md transition-all duration-400 ease-in-out transform
        ${style.bg} ${style.border}
        ${isExiting ? "translate-x-[120%] opacity-0" : "translate-x-0 opacity-100"}
      `}
    >
      <div className={`p-1.5 rounded-full bg-white/10 ${style.iconColor}`}>
        {React.cloneElement(style.icon, { className: "currentColor" })}
      </div>

      <div className="flex-1">
        <p className="text-sm font-black text-white">{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick?.();
              handleClose();
            }}
            className="mt-2 text-xs bg-white dark:glass-card text-zoop-obsidian dark:text-white px-3 py-1.5 rounded-md font-bold hover:bg-gray-100 transition-colors uppercase tracking-wider"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleClose}
        className="text-white/40 hover:text-white transition-colors"
      >
        <X width={16} height={16} />
      </button>
    </div>
  );
};
