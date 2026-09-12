import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  badge?: string;
  description?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'انتخاب کنید...',
  error,
  disabled = false,
  searchable = false,
  required = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && (searchable || options.length > 7)) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, searchable, options.length]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.trim().toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const showSearch = searchable || options.length > 7;

  return (
    <div className={`relative ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-right transition cursor-pointer select-none ${
          disabled
            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            : error
            ? 'bg-slate-800 border-rose-500 text-slate-100'
            : isOpen
            ? 'bg-slate-800 border-purple-500 ring-1 ring-purple-500/50 text-slate-100'
            : 'bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-purple-400">{selectedOption.icon}</span>
          )}
          {selectedOption?.color && (
            <span
              className="w-3 h-3 rounded-full shrink-0 border border-white/20"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span
            className={`text-xs sm:text-sm truncate ${
              selectedOption ? 'font-medium text-slate-100' : 'text-slate-400'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-sans">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-purple-400' : ''
          }`}
        />
      </button>

      {error && <p className="text-[11px] text-rose-400 mt-1 font-medium">{error}</p>}

      {/* Options Dropdown / Sheet */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="fixed inset-x-3 bottom-6 sm:bottom-auto sm:inset-x-auto sm:absolute sm:right-0 sm:mt-1.5 sm:w-full min-w-[240px] z-50 p-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-purple-950/50 text-slate-100 max-h-[70vh] sm:max-h-64 flex flex-col animate-in fade-in sm:zoom-in-95 duration-150"
          >
            {/* Search if enabled or many items */}
            {showSearch && (
              <div className="p-1.5 border-b border-slate-800 shrink-0 mb-1">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو بین گزینه‌ها..."
                    className="w-full h-8 pr-8 pl-7 rounded-lg bg-slate-800 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto space-y-1 flex-1 py-1">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  موردی یافت نشد.
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-right transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                          : 'text-slate-200 hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {opt.icon && (
                          <span className="shrink-0 text-slate-400">{opt.icon}</span>
                        )}
                        {opt.color && (
                          <span
                            className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                            style={{ backgroundColor: opt.color }}
                          />
                        )}
                        <div className="truncate">
                          <span className="text-xs sm:text-sm font-medium block truncate">
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 mr-2">
                        {opt.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-purple-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
