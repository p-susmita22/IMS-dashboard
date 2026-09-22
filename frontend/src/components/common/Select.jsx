import React from 'react';

export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = '',
  required = false,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-300 focus:border-slate-900 focus:ring-slate-100'
          }`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
