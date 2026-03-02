// Toast service to show notifications from anywhere
let toastHandler = null;

export const setToastHandler = (handler) => {
  toastHandler = handler;
};

export const showToast = {
  success: (message) => {
    if (toastHandler) toastHandler.success(message);
  },
  error: (message) => {
    if (toastHandler) toastHandler.error(message);
  },
  info: (message) => {
    if (toastHandler) toastHandler.info(message);
  },
  warning: (message) => {
    if (toastHandler) toastHandler.warning(message);
  },
};
