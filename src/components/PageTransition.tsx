import React from 'react';
import { motion } from 'framer-motion';
import { COOP_LOGO_URL } from '../constants/cloudinaryAssets';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export const LoginTransition: React.FC<{ userName?: string; userRole?: string }> = ({
  userName,
  userRole,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 bg-gradient-to-br from-[#3b1d6e]/90 via-[#4c1d95]/90 to-[#15803d]/85 backdrop-blur-xl flex items-center justify-center z-[100] pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-purple-200/50 flex flex-col items-center space-y-4 max-w-sm w-full mx-4 text-center"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 rounded-full border-4 border-emerald-400 border-t-[#7c3aed] shadow-lg"
          />
          <img
            src={COOP_LOGO_URL}
            alt="UC METC Logo"
            className="w-16 h-16 rounded-full absolute inset-0 m-auto object-cover border-2 border-white shadow-sm"
          />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {userName ? `Welcome back, ${userName}!` : 'Welcome to UC METC!'}
          </h3>
          {userRole && (
            <span className="inline-block px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7c3aed] bg-purple-100 rounded-full">
              {userRole}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 pt-2 text-xs font-bold text-slate-500">
          <div className="w-2 h-2 rounded-full bg-[#16a34a] animate-ping" />
          <span>Preparing your dashboard...</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
