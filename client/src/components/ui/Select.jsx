import React from 'react';

/**
 * Reusable Select Component
 * @param {string} label - Optional label for the select input
 * @param {string} error - Error message to display
 * @param {Array} options - Array of objects with { value, label }
 * @param {string} className - Additional CSS classes
 */
export function Select({
  label,
  error,
  options = [],
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <select
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...props}
      >
        {/* Placeholder logic: If no value is selected, show this first */}
        {!props.value && (
          <option value="" disabled>
            Select an option
          </option>
        )}
        
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}