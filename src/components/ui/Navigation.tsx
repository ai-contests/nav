import Link from 'next/link';
import { Terminal } from 'lucide-react';

export function Navigation() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-canvas/80 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/60">
            <div className="container flex h-16 items-center justify-between px-6">
                 <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg select-none">
                        <Terminal className="w-5 h-5" />
                        <span>AI_NAV_</span>
                    </Link>
                    
                    <nav className="hidden md:flex gap-6 text-sm font-medium font-mono">
                        <Link href="/hub" className="text-white hover:text-primary transition-colors">
                            /HUB
                        </Link>
                        <Link href="/signals" className="text-text-muted hover:text-primary transition-colors">
                            /SIGNALS
                        </Link>
                        <Link href="/logs" className="text-text-muted hover:text-primary transition-colors">
                             /LOGS
                        </Link>
                    </nav>
                 </div>

                 <div className="flex items-center gap-4">
                     <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     <span className="text-[10px] text-emerald-500 font-bold border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded">
                        NET_ONLINE
                     </span>
                 </div>
            </div>
        </header>
    );
}
