"use client";

import { LucideIcon, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

export default function PageHeader({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar..."
}: PageHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Icon className="w-8 h-8 text-primary" /> {title}
          </h1>
          <p className="text-gray-500 mt-1">{description}</p>
        </div>
        
        {actionLabel && onAction && (
          <button onClick={onAction} className="glass-button flex items-center gap-2 self-start md:self-center">
            <Plus className="w-5 h-5"/>
            <span>{actionLabel}</span>
          </button>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md group">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-gray-500"
          />
        </div>
      </div>
    </div>
  );
}
