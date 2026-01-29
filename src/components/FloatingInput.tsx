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
}: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className={`relative transition-transform duration-300 ${isFocused ? 'input-bounce' : ''}`}>
        <input
          type={showVisibility ? 'text' : type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=""
          className={`w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 ${isFocused ? 'input-focus-pulse' : ''}`}
          style={{
            WebkitAutofillTextFillColor: '#1e293b',
            WebkitAutofillBackgroundColor: 'white',
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
