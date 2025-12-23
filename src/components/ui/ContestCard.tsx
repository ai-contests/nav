import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Trophy } from 'lucide-react';
import { Contest } from '@/lib/data';

interface ContestCardProps {
  contest: Contest;
}

export function ContestCard({ contest }: ContestCardProps) {
  // Parse deadline relative time
  const daysLeft = contest.deadline 
    ? Math.max(0, Math.ceil((new Date(contest.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="flex flex-col md:flex-row bg-surface border border-slate-800 rounded-sm hover:border-secondary transition-all group overflow-hidden">
        {/* Left: Thumbnail */}
        <div className="w-full md:w-48 h-32 md:h-auto bg-slate-900 flex-shrink-0 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
            {contest.image_url ? (
                <img src={contest.image_url} alt={contest.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
                <span className="text-4xl">🤖</span>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-[10px] uppercase font-bold text-text-muted border border-slate-700 backdrop-blur-sm rounded-sm">
                {contest.platform}
            </div>
        </div>

        {/* Center: Info */}
        <div className="flex-1 p-4 md:p-5 flex flex-col justify-start">
            <div className="flex items-center gap-2 mb-2 text-xs text-text-muted uppercase font-bold tracking-wider">
               <span className={daysLeft > 0 ? "text-emerald-500" : "text-slate-500"}>
                 ● {contest.status.toUpperCase()}
               </span>
               <span className="text-slate-600">|</span>
               <span>Lvl {contest.difficulty || '?'}/10</span>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-secondary transition-colors font-mono">
                {contest.title}
            </h3>

            <p className="text-sm text-text-muted line-clamp-2 mb-4 flex-1">
                {contest.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
                {contest.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-1 bg-slate-800 text-secondary border border-slate-700/50 rounded-sm uppercase tracking-wide">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>

        {/* Right: Stats & Action */}
        <div className="w-full md:w-48 bg-slate-900/30 p-4 md:p-5 border-t md:border-t-0 md:border-l border-slate-800 flex flex-row md:flex-col justify-between items-center md:items-end">
            <div className="text-right">
                <div className="text-sm text-text-muted mb-1 flex items-center justify-end gap-1">
                     <Trophy className="w-3 h-3" /> Prize
                </div>
                <div className="text-lg font-bold text-accent-cyan font-mono">
                    {contest.prize}
                </div>
            </div>

            <div className="text-right hidden md:block">
                 <div className="text-sm text-text-muted mb-1 flex items-center justify-end gap-1">
                     <Clock className="w-3 h-3" /> Time
                </div>
                <div className="text-sm font-mono text-emerald-400">
                    {daysLeft} days left
                </div>
            </div>

            <Link href={`/contest/${contest.id}`} className="flex items-center gap-2 text-xs font-bold text-primary hover:text-white transition-colors uppercase border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-sm md:w-full md:justify-center">
                Details <ArrowRight className="w-3 h-3" />
            </Link>
        </div>
    </div>
  );
}
