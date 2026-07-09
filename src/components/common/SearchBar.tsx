import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
}) => {
  return (
    <div className={`relative flex items-center w-full max-w-sm ${className}`}>
      <Search className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-100 bg-slate-50 pl-10 pr-4 py-2 text-xs placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 transition-all"
      />
      <div className="absolute right-3 hidden sm:flex items-center space-x-0.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded-md text-[9px] text-slate-400 font-semibold pointer-events-none">
        <span>⌘</span>
        <span>K</span>
      </div>
    </div>
  );
};
export default SearchBar;
