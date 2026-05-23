import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-slate-700 transition-colors dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="group relative">
          <select
            ref={ref}
            disabled={disabled}
            className={`
              w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm
              shadow-sm outline-none transition-all duration-200
              hover:border-slate-400 hover:shadow-md
              focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
              disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-60
              dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100
              dark:hover:border-slate-500 dark:hover:bg-slate-750
              dark:focus:border-blue-400 dark:focus:ring-blue-400/10
              dark:disabled:bg-slate-900 dark:disabled:text-slate-500
              ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : ""}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 group-focus-within:rotate-180">
            <ChevronDown className={`h-5 w-5 transition-colors ${disabled ? "text-slate-300 dark:text-slate-600" : "text-slate-400 dark:text-slate-500"}`} />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 animate-shake text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
