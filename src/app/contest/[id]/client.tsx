"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ArrowLeft, Clock, ExternalLink, Trophy, Database, Target, Brain, Share2 } from 'lucide-react';
import { Contest } from '@/lib/data';
import { Navigation } from '@/components/ui/Navigation';

interface ContestDetailClientProps {
    contest: Contest;
}

export function ContestDetailClient({ contest }: ContestDetailClientProps) {


    // Parse deadline
    const daysLeft = contest.deadline 
        ? Math.max(0, Math.ceil((new Date(contest.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <div className="min-h-screen bg-canvas font-mono flex flex-col">
            <Navigation />
            
            {/* A. Image Banner (Added based on user feedback) */}
            {contest.image_url && (
                <div className="w-full h-48 md:h-80 relative overflow-hidden bg-black shrink-0">
                    {/* 1. Blurred Background Layer (Fills the container) */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                        style={{ backgroundImage: `url(${contest.image_url})` }}
                    ></div>
                    
                    {/* 2. Visual Overlay (Darken slightly) */}
                    <div className="absolute inset-0 bg-black/20"></div>

                    {/* 3. Main Image (Contain - No Cropping) */}
                    <img 
                        src={contest.image_url} 
                        alt={contest.title}
                        className="absolute inset-0 w-full h-full object-contain relative z-10"
                    />
                </div>
            )}

            {/* B. Intelligent Header (Top Banner) */}
            <header className="relative w-full border-b border-white/5 bg-surface/50 overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none"></div>
                
                <div className="container mx-auto px-6 py-12 relative z-10">
                    <div className="mb-6 flex items-center gap-2">
                         <Link href="/hub" className="text-xs text-text-muted hover:text-white flex items-center gap-1 transition-colors">
                            <ArrowLeft className="w-3 h-3" /> BACK_TO_HUB
                         </Link>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-8">
                        {/* Left: Info */}
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-sm mb-4">
                                <span className={`w-2 h-2 rounded-full ${contest.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                                    {contest.platform} NODE • ID: #{contest.id.slice(0, 8)}
                                </span>
                            </div>
                            
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                {contest.title}
                            </h1>
                            
                            <p className="text-slate-400 text-lg max-w-3xl leading-relaxed">
                                {contest.description.split('\n')[0].slice(0, 150)}...
                            </p>
                        </div>

                        {/* Right: Action */}
                        <div className="flex flex-col gap-4 min-w-[300px]">
                            {/* Countdown Box */}
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm">
                                <div className="text-xs text-text-muted uppercase mb-1 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Time Remaining
                                </div>
                                <div className="text-2xl font-mono text-emerald-400 tabular-nums font-bold">
                                    {daysLeft} <span className="text-sm text-slate-500 font-normal">DAYS</span>
                                </div>
                            </div>

                            <a 
                                href={contest.url}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group flex items-center justify-center gap-3 w-full py-4 bg-primary/10 hover:bg-primary/20 border border-primary text-primary hover:text-white transition-all uppercase font-bold tracking-widest text-sm rounded-sm"
                            >
                                Join Contest <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>

                            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                                <span>1,204 Teams Competing</span>
                                <button className="hover:text-white flex items-center gap-1">
                                    <Share2 className="w-3 h-3" /> SHARE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* B. Info Matrix (4-Grid Stats) */}
            <div className="border-b border-white/5 bg-surface">
                <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
                    <div className="p-6">
                        <div className="text-xs text-text-muted uppercase mb-2 flex items-center gap-2">
                            <Database className="w-3 h-3" /> Source Node
                        </div>
                        <div className="font-bold text-white">{contest.platform}</div>
                    </div>
                    <div className="p-6">
                         <div className="text-xs text-text-muted uppercase mb-2 flex items-center gap-2">
                             <Target className="w-3 h-3" /> Domain
                         </div>
                         <div className="font-bold text-white uppercase truncate">
                            {contest.tags[0] || 'GENERAL'}
                         </div>
                    </div>
                     <div className="p-6">
                        <div className="text-xs text-text-muted uppercase mb-2 flex items-center gap-2">
                             <Brain className="w-3 h-3" /> Difficulty
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-[80px]">
                                <div 
                                    className="h-full bg-amber-500" 
                                    style={{ width: `${(contest.difficulty || 5) * 10}%` }}
                                ></div>
                            </div>
                            <span className="text-sm text-amber-500 font-bold">
                                {contest.difficulty || 5}/10
                            </span>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-900/30">
                         <div className="text-xs text-text-muted uppercase mb-2 flex items-center gap-2">
                             <Trophy className="w-3 h-3" /> Total Bounty
                         </div>
                         <div className="text-xl md:text-2xl font-bold text-accent-cyan font-mono">
                             {contest.prize}
                         </div>
                    </div>
                </div>
            </div>

            {/* C. Content Split */}
            <div className="container mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
                 {/* Left Column (Main Content) */}
                {/* Left Column (Main Content) */}
                <div className="flex-1 min-w-0">
                    <div className="mb-8 border-b border-slate-800 pb-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest">
                            Description
                        </h2>
                    </div>

                    {/* Markdown Content */}
                    <div className="prose prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {contest.description || '*No description available.*'}
                        </ReactMarkdown>
                    </div>
                </div>

                 {/* Right Column (Sidebar) */}
                 <aside className="w-full lg:w-80 flex-shrink-0 space-y-8">
                      {/* Related Contests */}
                      <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-2">
                              Related Signals
                          </h3>
                          <div className="space-y-4">
                              {[1, 2, 3].map(i => (
                                  <div key={i} className="group p-4 bg-surface border border-slate-800 hover:border-slate-600 transition-colors rounded-sm cursor-pointer">
                                      <div className="flex justify-between items-start mb-2">
                                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-sm">CV</span>
                                          <span className="text-[10px] text-emerald-500">2d left</span>
                                      </div>
                                      <h4 className="font-bold text-slate-200 group-hover:text-primary transition-colors text-sm mb-1">
                                          Underwater Sonar Det.
                                      </h4>
                                      <div className="text-xs text-slate-500">$5,000 CR</div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Tech Stack Pills */}
                       <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-2">
                              Tech Stack
                          </h3>
                          <div className="flex flex-wrap gap-2">
                              {['PyTorch', 'TensorFlow', 'Python', 'Docker'].map(tag => (
                                  <span key={tag} className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
                                      {tag}
                                  </span>
                              ))}
                          </div>
                      </div>
                 </aside>
            </div>
        </div>
    );
}
