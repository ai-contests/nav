"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Contest } from '@/lib/data';
import { ContestCard } from '@/components/ui/ContestCard';
import { FilterSidebar } from '@/components/ui/FilterSidebar';
import { Navigation } from '@/components/ui/Navigation';
import { LayoutGrid, List } from 'lucide-react';

interface HubClientProps {
    initialContests: Contest[];
}

export function HubClient({ initialContests }: HubClientProps) {
    const { isSignedIn } = useAuth();
    const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
    
    // Fetch subscriptions on mount
    useEffect(() => {
        if (!isSignedIn) {
            setSubscribedIds([]);
            return;
        }

        fetch('/api/subscription')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSubscribedIds(data);
                }
            })
            .catch(err => console.error("Failed to fetch subscriptions:", err));
    }, [isSignedIn]);

    const handleToggleSubscription = (contestId: string, newState: boolean) => {
        if (newState) {
            setSubscribedIds(prev => [...prev, contestId]);
        } else {
            setSubscribedIds(prev => prev.filter(id => id !== contestId));
        }
    };

    const [filters, setFilters] = useState({
        platforms: [] as string[],
        types: [] as string[],
        status: 'active' as string
    });

    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Filter Logic
    const filteredContests = useMemo(() => {
        return initialContests.filter(c => {
            // Platform Filter
            if (filters.platforms.length > 0 && !filters.platforms.includes(c.platform)) return false;
            
            // Status Filter
            if (filters.status === 'active' && c.status !== 'Active') return false;

            return true;
        });
    }, [initialContests, filters]);

    return (
        <>
            <Navigation />
            
            <main className="container mx-auto px-6 py-8 flex-1">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="text-sm text-text-muted mb-2">HOME / HUB</div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        &gt; Contest Hub
                    </h1>
                    <p className="text-text-muted text-sm max-w-2xl">
                        Global neural interface for competitive intelligence signals. 
                        Monitoring {initialContests.length} total nodes.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left Sidebar */}
                    <FilterSidebar filters={filters} setFilters={setFilters} />

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                             <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-bold text-lg">
                                    {filteredContests.length}
                                </span>
                                <span className="text-text-muted text-sm">Contests Found</span>
                             </div>

                             <div className="flex gap-2">
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                             </div>
                        </div>

                        {/* List */}
                        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                            {filteredContests.length > 0 ? (
                                filteredContests.map(contest => (
                                    <ContestCard 
                                        key={contest.id} 
                                        contest={contest} 
                                        isSubscribed={subscribedIds.includes(contest.id)}
                                        onToggleSubscription={(status) => handleToggleSubscription(contest.id, status)}
                                    />
                                ))
                            ) : (
                                <div className="py-20 text-center border border-dashed border-slate-800 rounded-sm">
                                    <div className="text-4xl mb-4">🔭</div>
                                    <h3 className="text-xl font-bold text-text-muted mb-2">No Signals Detected</h3>
                                    <p className="text-slate-600">Try adjusting your sensors (filters).</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination (Mock) */}
                        {filteredContests.length > 5 && (
                             <div className="mt-8 flex justify-end gap-2 text-sm font-mono">
                                 <button className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-500 hover:border-primary hover:text-primary">&lt;</button>
                                 <button className="px-3 py-1 bg-primary text-white font-bold">1</button>
                                 <button className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:border-primary hover:text-primary">2</button>
                                 <button className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:border-primary hover:text-primary">3</button>
                                 <span className="px-2 py-1 text-slate-600">...</span>
                                 <button className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-500 hover:border-primary hover:text-primary">&gt;</button>
                             </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-8 mt-auto">
                 <div className="container mx-auto px-6 text-center text-xs text-slate-600">
                     &copy; 2025 AI_NAV INC. All systems operational.
                 </div>
            </footer>
        </>
    );
}
