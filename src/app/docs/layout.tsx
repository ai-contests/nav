"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/ui/Navigation';
import { Book, HelpCircle, Code, Info } from 'lucide-react';

const DOCS_NAV = [
    { title: 'Introduction', href: '/docs', icon: Info },
    { title: 'How to Participate', href: '/docs/participate', icon: Book },
    { title: 'FAQ', href: '/docs/faq', icon: HelpCircle },
    { title: 'Contributing', href: '/docs/contributing', icon: Code },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-canvas font-mono flex flex-col">
            <Navigation />
            
            <div className="flex-1 container mx-auto flex flex-col lg:flex-row">
                {/* Sidebar */}
                <aside className="w-full lg:w-64 border-r border-white/5 py-8 lg:min-h-[calc(100vh-64px)]">
                    <div className="px-6 mb-8">
                        <h2 className="text-sm font-bold text-accent tracking-widest uppercase mb-1">
                            // Documentation
                        </h2>
                        <div className="text-xs text-slate-500">v1.0.0</div>
                    </div>

                    <nav className="flex flex-col">
                        {DOCS_NAV.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            
                            return (
                                <Link 
                                    key={item.href} 
                                    href={item.href}
                                    className={`flex items-center gap-3 px-6 py-3 text-sm transition-all border-l-2 ${
                                        isActive 
                                            ? 'border-primary bg-slate-800/50 text-white font-bold' 
                                            : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-8 px-6 lg:px-12 max-w-4xl">
                    <div className="prose prose-invert prose-blue prose-headings:font-mono prose-headings:font-bold prose-p:text-slate-300 prose-li:text-slate-300 max-w-none">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
