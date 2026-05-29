import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, ShoppingBag, Mail, CreditCard, Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
  action?: {
    label: string;
    path: string;
  };
}

interface WelcomeTourProps {
  userName: string;
  onComplete: () => void;
}

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ userName, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  const tourSteps: TourStep[] = [
    {
      title: `Welcome to UC METC SILMS, ${userName}! 🎉`,
      description: 'We\'re excited to have you here! Let us show you around and help you get started with our cooperative system.',
      icon: <Check size={48} className="text-green-500" />,
    },
    {
      title: 'Shop for Merchandise 🛍️',
      description: 'Browse and purchase uniforms, accessories, and equipment. Add items to your cart and checkout easily with cash or e-wallet payment.',
      icon: <ShoppingBag size={48} className="text-green-600" />,
      action: {
        label: 'Visit Merchandise',
        path: '/merchandise',
      },
    },
    {
      title: 'Search Anything 🔍',
      description: 'Use the search bar (Ctrl+K) to quickly find pages and products. Just type what you\'re looking for and navigate instantly!',
      icon: <Search size={48} className="text-purple-600" />,
    },
    {
      title: 'Stay Connected 📬',
      description: 'Check your inbox for messages from admin and staff. Send messages and stay updated with important announcements.',
      icon: <Mail size={48} className="text-blue-600" />,
      action: {
        label: 'Open Inbox',
        path: '/inbox',
      },
    },
    {
      title: 'Get Notified 🔔',
      description: 'Receive real-time notifications for messages, order updates, and membership status. Click the bell icon to view your notifications.',
      icon: <Bell size={48} className="text-orange-600" />,
    },
    {
      title: 'Track Your Orders 📦',
      description: 'View your transaction history, check order status, and download receipts. All your purchases in one place!',
      icon: <CreditCard size={48} className="text-indigo-600" />,
      action: {
        label: 'View Transactions',
        path: '/transaction',
      },
    },
    {
      title: 'You\'re All Set! ✨',
      description: 'That\'s it! You\'re ready to explore. If you need help, don\'t hesitate to contact the admin or staff through the inbox.',
      icon: <Check size={48} className="text-green-500" />,
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsClosing(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleComplete = () => {
    setIsClosing(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleActionClick = (path: string) => {
    navigate(path);
    handleComplete();
  };

  const currentTourStep = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-8 overflow-y-auto ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}>
        {/* Progress Bar */}
        <div className="h-2 bg-slate-200">
          <div
            className="h-full bg-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
              {currentStep + 1}
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">Step {currentStep + 1} of {tourSteps.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">Getting Started Tour</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 min-h-[280px] sm:min-h-[400px] flex flex-col items-center justify-center text-center">
          {/* Icon */}
          <div className="mb-4 sm:mb-6 animate-bounce-slow">
            {currentTourStep.icon}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-4 px-2">
            {currentTourStep.title}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-lg text-slate-600 max-w-lg mb-4 sm:mb-6 px-4">
            {currentTourStep.description}
          </p>

          {/* Action Button */}
          {currentTourStep.action && (
            <button
              onClick={() => handleActionClick(currentTourStep.action!.path)}
              className="mb-2 sm:mb-4 px-5 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 hover:shadow-lg transition-all text-xs sm:text-base"
            >
              {currentTourStep.action.label}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-base ${
              currentStep === 0
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
            Previous
          </button>

          <div className="hidden sm:flex gap-1.5">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-6 bg-purple-600'
                    : index < currentStep
                    ? 'bg-purple-600'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 hover:shadow-lg transition-all text-xs sm:text-base"
          >
            {currentStep === tourSteps.length - 1 ? (
              <>
                Get Started
                <Check size={16} className="sm:w-5 sm:h-5" />
              </>
            ) : (
              <>
                Next
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
