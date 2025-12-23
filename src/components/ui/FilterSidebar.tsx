"use client";

import React from 'react';

type FilterState = {
    platforms: string[];
    types: string[];
    status: string;
};

interface FilterSidebarProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export function FilterSidebar({ filters, setFilters }: FilterSidebarProps) {
    const handlePlatformChange = (p: string) => {
        setFilters(prev => ({
            ...prev,
            platforms: prev.platforms.includes(p) 
                ? prev.platforms.filter(x => x !== p)
                : [...prev.platforms, p]
        }));
    };

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-8 sticky top-24 self-start">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold text-accent tracking-widest uppercase">// Filters</h2>
                <button 
                    onClick={() => setFilters({ platforms: [], types: [], status: 'active' })}
                    className="text-xs text-text-muted hover:text-white underline decoration-dotted"
                >
                    Reset
                </button>
            </div>

            {/* Platform Filter */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-muted uppercase">Platform</h3>
                <div className="space-y-2">
                    {['ModelScope', 'Civitai', 'Kaggle', 'DrivenData', 'AIcrowd'].map(p => (
                        <label key={p} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-all ${
                                filters.platforms.includes(p) ? 'bg-primary border-primary' : 'border-slate-600 bg-canvas group-hover:border-primary'
                            }`}>
                                {filters.platforms.includes(p) && <div className="w-2 h-2 bg-white rounded-[1px]" />}
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={filters.platforms.includes(p)} 
                                onChange={() => handlePlatformChange(p)} 
                            />
                            <span className={`text-sm ${filters.platforms.includes(p) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                {p}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-muted uppercase">Status</h3>
                <div className="flex flex-col gap-2">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                             filters.status === 'active' ? 'border-emerald-500' : 'border-slate-600 group-hover:border-emerald-400'
                        }`}>
                             {filters.status === 'active' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                        </div>
                        <input type="radio" className="hidden" 
                            checked={filters.status === 'active'} 
                            onChange={() => setFilters(prev => ({ ...prev, status: 'active' }))} 
                        />
                        <span className="text-sm text-slate-400">Active Signals</span>
                     </label>

                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                             filters.status === 'all' ? 'border-slate-400' : 'border-slate-600'
                        }`}>
                             {filters.status === 'all' && <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                        </div>
                        <input type="radio" className="hidden" 
                             checked={filters.status === 'all'} 
                             onChange={() => setFilters(prev => ({ ...prev, status: 'all' }))} 
                        />
                        <span className="text-sm text-slate-400">All History</span>
                     </label>
                </div>
            </div>

            {/* Difficulty Slider (Visual Only for now) */}
            <div className="space-y-3 opacity-50 pointer-events-none">
                 <h3 className="text-xs font-bold text-text-muted uppercase">Difficulty (Coming Soon)</h3>
                 <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-1/3"></div>
                 </div>
                 <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                     <span>NOVICE</span>
                     <span>EXPERT</span>
                 </div>
            </div>
        </aside>
    );
}
