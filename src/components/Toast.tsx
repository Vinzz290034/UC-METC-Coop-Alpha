import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, LogOut, XCircle, X } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { Z_INDEX } from '../constants/zIndex';

interface ToastProps {
  message: string;
  type: 'success' | 'logout' | 'error';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 2000); // Reduced from 3000ms to 2000ms (2 seconds)
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-emerald-500',
          icon: <CheckCircle2 size={24} className="text-white" />,
        };
      case 'logout':
        return {
          bgColor: 'bg-emerald-500',
          icon: <LogOut size={24} className="text-white" />,
        };
      default:
        return {
          bgColor: 'bg-red-500',
          icon: <XCircle size={24} className="text-white" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-auto sm:max-w-md flex items-center space-x-3 ${styles.bgColor} text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg shadow-2xl cursor-pointer hover:opacity-90 transition-all duration-200`}
      style={{ zIndex: Z_INDEX.TOAST }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: 0.1, 
          duration: 0.5,
          type: 'spring',
          stiffness: 200,
          damping: 15
        }}
      >
        {styles.icon}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="flex-1"
      >
        <p className="font-semibold text-sm">{message}</p>
      </motion.div>
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.2 }}
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close notification"
      >
        <X size={16} className="text-white" />
      </motion.button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { notificationMessage, clearNotification, notificationType } = useUIStore();

  return (
    <AnimatePresence>
      {notificationMessage && (
        <Toast
          message={notificationMessage}
          type={(notificationType as 'success' | 'logout' | 'error') || 'success'}
          onClose={clearNotification}
        />
      )}
    </AnimatePresence>
  );
};
