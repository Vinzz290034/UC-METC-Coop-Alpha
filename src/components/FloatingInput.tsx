import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  showToggle?: boolean;
  showVisibility?: boolean;
  onToggleVisibility?: () => void;
  focusColor?: 'purple' | 'green';
}

export const FloatingInput = React.memo(({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  showToggle = false,
  showVisibility = false,
  onToggleVisibility = () => {},
  focusColor = 'purple',
}: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const focusColorClass = focusColor === 'green' 
    ? 'focus:border-green-500 focus:ring-green-200'
    : 'focus:border-purple-500 focus:ring-purple-200';

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={showVisibility ? 'text' : type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=""
          className={`w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 ${focusColorClass} ${isFocused ? 'animate-bounce' : ''}`}
          style={{
            WebkitAutofillTextFillColor: '#1e293b',
            WebkitAutofillBackgroundColor: 'white',
            animation: isFocused ? 'inputBounce 0.3s ease-out' : 'none',
          } as React.CSSProperties}
          required={required}
          autoComplete="off"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-700"
          >
            {showVisibility ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
});

FloatingInput.displayName = 'FloatingInput';
