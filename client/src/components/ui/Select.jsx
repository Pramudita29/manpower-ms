"use client";
import React from 'react';

export function Select({ label, options = [], value, onChange, placeholder, disabled, required }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 transition-all border-gray-200"
      >
        <option value="">{placeholder || "Select an option"}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}