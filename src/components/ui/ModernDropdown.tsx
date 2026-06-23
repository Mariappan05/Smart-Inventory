"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Loader2, Check } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
}

interface ModernDropdownProps {
  // Data
  options: DropdownOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  
  // Configuration
  mode?: "single" | "multiple";
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  
  // States
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  
  // Styling
  label?: string;
  className?: string;
  error?: string;
  
  // Features
  searchable?: boolean;
  clearable?: boolean;
  maxHeight?: string;
  
  // Callbacks
  onSearch?: (term: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function ModernDropdown({
  options,
  value,
  onChange,
  mode = "single",
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  disabled = false,
  loading = false,
  required = false,
  label,
  className = "",
  error,
  searchable = true,
  clearable = true,
  maxHeight = "320px",
  onSearch,
  onOpen,
  onClose,
}: ModernDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get selected options
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  // Filter options
  const filteredOptions = searchable
    ? options.filter(
        (option) => {
          const label = String(option?.label || '');
          const subtitle = String(option?.subtitle || '');
          const search = searchTerm.toLowerCase();
          return label.toLowerCase().includes(search) ||
                 subtitle.toLowerCase().includes(search);
        }
      )
    : options;

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Reset highlighted index on search
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && optionsRef.current && highlightedIndex >= 0) {
      const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle search with debounce
  useEffect(() => {
    if (onSearch && searchTerm) {
      const timer = setTimeout(() => {
        onSearch(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, onSearch]);

  const handleOpen = () => {
    if (!disabled && !loading) {
      setIsOpen(true);
      onOpen?.();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(0);
    onClose?.();
  };

  const handleSelect = (optionValue: string) => {
    if (mode === "single") {
      onChange(optionValue);
      handleClose();
    } else {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(mode === "single" ? "" : []);
    handleClose();
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        handleClose();
        break;
      case "Tab":
        handleClose();
        break;
    }
  };

  // Display text for button
  const getDisplayText = () => {
    if (loading) return "Loading...";
    if (selectedOptions.length === 0) return placeholder;
    if (mode === "single") return selectedOptions[0]?.label || placeholder;
    return `${selectedOptions.length} selected`;
  };

  const showClearButton = clearable && !disabled && !loading && selectedValues.length > 0;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={`
          w-full rounded-lg border bg-white px-4 py-2.5 text-left
          flex justify-between items-center gap-2
          transition-all duration-200
          ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 hover:border-slate-400"
          }
          ${disabled || loading ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"}
          ${isOpen ? "border-slate-500 ring-2 ring-slate-500/20" : ""}
          dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500
          dark:focus:border-slate-400 dark:focus:ring-slate-400/20
        `}
      >
        <span
          className={`flex-1 truncate ${
            selectedOptions.length === 0
              ? "text-slate-400 dark:text-slate-500"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {getDisplayText()}
        </span>

        <div className="flex items-center gap-2 flex-shrink-0">
          {loading && <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />}
          {showClearButton && (
            <X
              className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Error Message */}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && !disabled && !loading && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2 z-50
            bg-white dark:bg-slate-700
            border border-slate-300 dark:border-slate-600
            rounded-lg shadow-xl
            flex flex-col
            animate-in fade-in slide-in-from-top-2 duration-200
          "
          style={{ maxHeight }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="
                    w-full pl-10 pr-4 py-2
                    border border-slate-300 dark:border-slate-600
                    rounded-lg
                    focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20
                    text-slate-900 dark:text-white
                    bg-white dark:bg-slate-700
                    text-sm
                    transition-all
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                  "
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div ref={optionsRef} className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.value);
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={`
                      w-full text-left px-4 py-3
                      transition-colors duration-150
                      flex items-center justify-between gap-3
                      ${option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      ${
                        isSelected
                          ? "bg-black text-white dark:bg-slate-900"
                          : isHighlighted
                          ? "bg-slate-100 dark:bg-slate-600"
                          : "hover:bg-slate-50 dark:hover:bg-slate-600/50"
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium text-sm truncate ${
                          isSelected
                            ? "text-white"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {option.label}
                      </div>
                      {option.subtitle && (
                        <div
                          className={`text-xs mt-0.5 truncate ${
                            isSelected
                              ? "text-white/80"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 flex-shrink-0 text-white" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Multiple Selection Footer */}
          {mode === "multiple" && selectedOptions.length > 0 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 sticky bottom-0">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>{selectedOptions.length} item(s) selected</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
