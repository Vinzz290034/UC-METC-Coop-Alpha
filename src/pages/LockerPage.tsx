import React from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LockerPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 flex items-center justify-center p-4 animate-slide-in-right">
      <div className="text-center">
        {/* Lock Icon */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white/20 p-8 rounded-full backdrop-blur-sm">
            <Lock size={80} className="text-white" />
          </div>
        </div>

        {/* Coming Soon Text */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          Coming Soon
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8">
          Locker Management feature is under development
        </p>

        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
