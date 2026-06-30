import React from 'react';
import { X } from 'lucide-react';

export function SidePanel({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="w-full lg:w-[350px] xl:w-[400px] bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden self-start transition-all duration-300 animate-in fade-in slide-in-from-right-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20">
        <h3 className="font-semibold text-zinc-950 dark:text-zinc-50 truncate text-sm">
          {title}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 overflow-y-auto max-h-[700px] text-sm">
        {children}
      </div>
    </div>
  );
}
