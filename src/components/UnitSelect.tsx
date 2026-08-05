'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface Unidad {
  id: string;
  nombre: string;
}

interface UnitSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Unidad[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function UnitSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona o busca unidad...",
  required = false,
  className = ""
}: UnitSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = search.trim() === ''
    ? options
    : options.filter(o => o.nombre.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (nombre: string) => {
    onChange(nombre);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for native HTML form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          tabIndex={-1}
          className="sr-only"
        />
      )}

      {/* Main Select Button / Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
          isOpen 
            ? 'border-teal-500 ring-2 ring-teal-500/20' 
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <span className={`truncate font-extrabold uppercase ${value ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 font-medium normal-case'}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
        </div>
      </div>

      {/* Floating Dropdown Overlay */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 relative">
            <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar unidad..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 hide-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-[11px] text-slate-400 text-center font-medium">
                No se encontraron unidades coincidente.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.nombre === value;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt.nombre)}
                    className={`px-3 py-2 text-xs font-bold uppercase cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{opt.nombre}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
