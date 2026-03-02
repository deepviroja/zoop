import { useEffect } from 'react';
import { X } from '../../assets/icons/X';
import { Check } from '../../assets/icons/Check';
import { AlertCircle } from '../../assets/icons/AlertCircle';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white'
  };

  const icons = {
    success: <Check width={20} height={20} />,
    error: <X width={20} height={20} />,
    info: <AlertCircle width={20} height={20} />,
    warning: <AlertCircle width={20} height={20} />
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${styles[type]} animate-slideIn`}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="font-bold">{message}</p>
      <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity">
        <X width={16} height={16} />
      </button>
    </div>
  );
};
