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
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
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
  onKeyDown,
  inputMode,
  maxLength,
}: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const isActive = isFocused || value.length > 0;

  const labelColorClass = focusColor === 'green'
    ? isActive ? 'text-green-600' : 'text-slate-500'
    : isActive ? 'text-purple-600' : 'text-slate-500';

  return (
    <div className="relative">
      <input
        type={showVisibility ? 'text' : type}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder=" "
        className={`peer w-full px-4 pt-6 pb-2 border-2 border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
          focusColor === 'green' 
            ? 'focus:border-green-500 focus:ring-green-200' 
            : 'focus:border-purple-500 focus:ring-purple-200'
        } hover:border-${focusColor === 'green' ? 'green' : 'purple'}-400 hover:shadow-md`}
        required={required}
        autoComplete="off"
      />
      <label
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${labelColorClass} ${
          isActive
            ? 'top-1.5 text-xs font-semibold'
            : 'top-4 text-base'
        }`}
      >
        {label}
      </label>
      {showToggle && (
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
          tabIndex={-1}
        >
          {showVisibility ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
});

FloatingInput.displayName = 'FloatingInput';
