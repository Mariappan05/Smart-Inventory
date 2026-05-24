"use client";

import { ModernDropdown, DropdownOption } from "./ModernDropdown";

interface Option {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  className?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  error?: string;
}

/**
 * SearchableSelect - Backward compatible wrapper for ModernDropdown
 * @deprecated Use ModernDropdown directly for new implementations
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  label,
  required = false,
  className = "",
  searchPlaceholder = "Search...",
  loading = false,
  error,
}: SearchableSelectProps) {
  const handleChange = (newValue: string | string[]) => {
    onChange(newValue as string);
  };

  return (
    <ModernDropdown
      options={options as DropdownOption[]}
      value={value}
      onChange={handleChange}
      mode="single"
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      disabled={disabled}
      loading={loading}
      required={required}
      label={label}
      className={className}
      error={error}
      searchable={true}
      clearable={true}
    />
  );
}
