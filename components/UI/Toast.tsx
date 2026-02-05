
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 4000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const borderColors = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-orange-500',
    info: 'border-l-blue-500'
  };

  return (
    <div className={`flex items-start w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 animate-slide-in-right border-l-4 ${borderColors[type]} pointer-events-auto`}>
       <div className="p-4 flex items-start gap-3 w-full">
          <div className="flex-shrink-0 mt-0.5">
             {icons[type]}
          </div>
          <div className="flex-1 pt-0.5">
             <p className="text-sm font-medium text-gray-800 leading-snug">{message}</p>
          </div>
          <button 
            onClick={() => onClose(id)} 
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
             <X size={16} />
          </button>
       </div>
    </div>
  );
};
