import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  floatingLabel?: boolean;
}

export const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  className = '',
  floatingLabel = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && !floatingLabel && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 ${
          floatingLabel ? 'pt-6 pb-2 min-h-[54px]' : 'py-2.5 min-h-[44px]'
        } bg-white border-2 ${
          isOpen
            ? 'border-purple-600 ring-4 ring-purple-100 shadow-md'
            : 'border-slate-300 hover:border-purple-400 hover:shadow-xs'
        } rounded-xl text-left cursor-pointer transition-all duration-200 outline-none`}
      >
        <span className={`text-sm font-semibold truncate ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-purple-600 ml-2 flex-shrink-0 transition-transform duration-300 ease-out ${
            isOpen ? 'rotate-180 text-purple-700 scale-110' : 'rotate-0'
          }`}
        />
      </button>

      {floatingLabel && label && (
        <label
          className={`absolute left-4 pointer-events-none transition-all duration-200 ${
            isOpen || value
              ? 'top-2 text-xs font-bold uppercase tracking-wider text-purple-600'
              : 'top-4 text-sm font-medium text-slate-400'
          }`}
        >
          {label}
        </label>
      )}

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[105%] z-50 bg-white border border-purple-100 rounded-xl shadow-2xl overflow-hidden py-1.5 animate-dropdown-bounce border-t-2 border-t-purple-500">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-purple-50 text-purple-700 font-bold border-l-4 border-purple-600 pl-3'
                      : 'text-slate-700 hover:bg-purple-50/70 hover:text-purple-700 hover:pl-5'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2 animate-scale-in" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
