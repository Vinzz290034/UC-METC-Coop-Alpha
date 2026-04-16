import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, LogOut, XCircle } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

interface ToastProps {
  message: string;
  type: 'success' | 'logout' | 'error';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
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
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-6 left-6 flex items-center space-x-3 ${styles.bgColor} text-white px-6 py-4 rounded-lg shadow-2xl z-[9999]`}
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
      >
        <p className="font-semibold text-sm">{message}</p>
      </motion.div>
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
