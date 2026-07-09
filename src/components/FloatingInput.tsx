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
  compact?: boolean;
  thick?: boolean;
  center?: boolean;
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
  compact = false,
  thick = false,
  center = false,
}: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const isActive = isFocused || value.length > 0 || type === 'date';

  const labelColorClass = focusColor === 'green'
    ? isActive ? 'text-green-600 font-semibold' : 'text-slate-500'
    : isActive ? 'text-purple-600 font-semibold' : 'text-slate-500';

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
        className={`peer w-full text-slate-900 bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
          center ? 'text-center' : ''
        } ${
          thick 
            ? 'border-[3px] rounded-2xl px-6 py-5 text-lg font-bold' 
            : compact 
              ? 'border-2 rounded-lg px-3 py-3 text-sm' 
              : 'border-2 rounded-lg px-4 py-4 text-base'
        } ${
          focusColor === 'green' 
            ? 'border-slate-300 focus:border-green-500 focus:ring-green-100 hover:border-green-400' 
            : 'border-slate-300 focus:border-purple-500 focus:ring-purple-100 hover:border-purple-400'
        } hover:shadow-md`}
        required={required}
        autoComplete="off"
      />
      <label
        className={`absolute transition-all duration-200 pointer-events-none ${labelColorClass} -translate-y-1/2 ${
          center
            ? isActive
              ? thick 
                ? 'left-6 -translate-x-0' 
                : compact 
                  ? 'left-3 -translate-x-0' 
                  : 'left-4 -translate-x-0'
              : 'left-1/2 -translate-x-1/2'
            : thick 
              ? 'left-6' 
              : compact 
                ? 'left-3' 
                : 'left-4'
        } ${
          isActive
            ? `${thick ? 'px-2' : 'px-1.5'} bg-white ${
                thick 
                  ? 'top-0 text-xs font-black uppercase tracking-wider' 
                  : compact 
                    ? 'top-0 text-[10px] font-bold' 
                    : 'top-0 text-xs font-semibold'
              }`
            : `bg-transparent px-0 ${
                thick 
                  ? 'top-1/2 text-lg font-semibold' 
                  : compact 
                    ? 'top-1/2 text-sm' 
                    : 'top-1/2 text-base'
              }`
        }`}
      >
        {label}
      </label>
      {showToggle && (
        <button
          type="button"
          onClick={onToggleVisibility}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 ${
            compact ? 'scale-90' : ''
          }`}
          tabIndex={-1}
        >
          {showVisibility ? <EyeOff size={compact ? 16 : 20} /> : <Eye size={compact ? 16 : 20} />}
        </button>
      )}
    </div>
  );
});

FloatingInput.displayName = 'FloatingInput';
