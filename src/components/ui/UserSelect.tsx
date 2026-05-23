"use client";

import { User } from "lucide-react";

type UserOption = {
  value: string;
  label: string;
  imageUrl?: string | null;
};

type UserSelectProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: UserOption[];
  placeholder?: string;
  className?: string;
};

export function UserSelect({ value, onChange, options, placeholder, className = "" }: UserSelectProps) {
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2">
        {selectedOption && (
          <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            {selectedOption.imageUrl ? (
              <img
                src={selectedOption.imageUrl}
                alt={selectedOption.label}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        )}
      </div>
      <select
        value={value}
        onChange={onChange}
        className={`w-full appearance-none rounded-xl border border-slate-300 bg-white ${selectedOption ? 'pl-14' : 'pl-4'} pr-10 py-3 text-sm shadow-sm outline-none transition-all duration-200 hover:border-slate-400 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
