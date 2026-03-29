import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = "Search...", className = "" }) => {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
                type="text"
                placeholder={placeholder}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-neutral-600 focus:bg-neutral-800/50"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default SearchBar;
