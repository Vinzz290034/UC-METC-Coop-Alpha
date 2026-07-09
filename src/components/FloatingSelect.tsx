import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  options: string[];
  thick?: boolean;
}

export const FloatingSelect = React.memo(({
  label,
  value,
  onChange,
  options,
  thick = false,
}: FloatingSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasOptions = options.length > 0;

  return (
    <div className="relative">
      <label className={`block font-semibold text-slate-700 mb-1 ${thick ? 'text-sm' : 'text-xs'}`}>
        {label}
      </label>
      <div>
        <button
          type="button"
          disabled={!hasOptions}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-white text-slate-900 focus:outline-none transition-all duration-200 text-left ${
            thick 
              ? 'px-6 py-5 border-[3px] border-slate-300 rounded-2xl text-lg font-bold focus:border-purple-500 focus:ring-4 focus:ring-purple-100 hover:border-purple-400' 
              : 'px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-slate-400'
          } ${
            !hasOptions ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
          }`}
        >
          <span className={value ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}>
            {!hasOptions ? 'Select course first' : (value || 'Select an option')}
          </span>
          <ChevronDown size={thick ? 20 : 16} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && hasOptions && (
          <>
            {/* Overlay to close the dropdown */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className={`absolute left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-xl z-20 py-1 overflow-y-auto animate-scale-in ${
              thick ? 'max-h-64' : 'max-h-48'
            }`}>
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange({ target: { value: opt } });
                    setIsOpen(false);
                  }}
                  className={`w-full text-left transition-colors duration-150 ${
                    thick 
                      ? 'px-6 py-3 text-base' 
                      : 'px-3 py-1.5 text-sm'
                  } ${
                    value === opt
                      ? 'bg-purple-50 text-purple-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

FloatingSelect.displayName = 'FloatingSelect';
