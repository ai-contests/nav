import Link from "next/link";
import { ArrowRight, Terminal, Globe, Cpu, BarChart3 } from "lucide-react";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-canvas">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-canvas to-canvas pointer-events-none" />
      
      {/* Header/Nav (Simplified relative to full app, just for landing) */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <Terminal className="w-5 h-5" />
          <span>AI_NAV</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-text-muted">
          <Link href="/hub" className="hover:text-primary transition-colors">/hub</Link>
          <Link href="/docs" className="hover:text-primary transition-colors">/docs</Link>
          <Link href="https://github.com/ai-contests/nav" className="hover:text-primary transition-colors">/github</Link>
          
          <div className="pl-6 ml-2 border-l border-white/10 flex items-center">
            <SignedOut>
                <SignInButton mode="modal">
                    <button className="text-primary hover:text-white font-bold transition-colors">
                        [ LOGIN ]
                    </button>
                </SignInButton>
            </SignedOut>
            <SignedIn>
                <UserButton 
                    appearance={{
                        elements: {
                            avatarBox: "w-8 h-8 rounded-sm border border-primary/20",
                            userButtonTrigger: "rounded-sm focus:shadow-none"
                        }
                    }}
                />
            </SignedIn>
          </div>
        </nav>
      </header>

      <main className="relative z-10 flex-1 container mx-auto px-6 flex flex-col">
        
        {/* Hero Section */}
        <section className="flex-1 flex flex-col justify-center py-20 lg:py-32 max-w-4xl">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-main">
              <span className="text-primary mr-4">&gt;</span>
              INITIALIZING<br />
              <span className="text-glow">INTELLIGENCE_NAVIGATOR</span>
            </h1>
            
            <p className="text-lg md:text-xl text-text-muted max-w-2xl border-l-2 border-primary/30 pl-6 py-2">
              The definitive terminal for global AI competitions. 
              Monitor ModelScope, Civitai, Kaggle and more in real-time.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/hub" 
                className="group flex items-center gap-2 bg-primary hover:bg-yellow-500 text-white px-8 py-4 rounded-md font-bold transition-all shadow-[0_0_20px_rgba(0,71,171,0.4)] hover:shadow-[0_0_30px_rgba(0,71,171,0.6)]">
                [ ENTER_HUB ]
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link href="/docs" 
                className="flex items-center gap-2 border border-slate-700 hover:border-primary text-text-muted hover:text-primary px-8 py-4 rounded-md transition-colors bg-surface/50 backdrop-blur-sm">
                [ READ_DOCS ]
              </Link>
            </div>
          </div>
        </section>

        {/* System Modules (Features) */}
        <section className="py-20 border-t border-border/30">
          <div className="flex items-center gap-4 mb-12">
            <span className="text-accent font-bold">// SYSTEM_MODULES</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-secondary" />}
              title="GLOBAL_SCAN"
              desc="Real-time monitoring of ModelScope, Civitai, Kaggle and other major competition platforms."
            />
            <FeatureCard 
              icon={<Cpu className="w-8 h-8 text-secondary" />}
              title="AI_ANALYSIS"
              desc="Automated difficulty assessment, tagging, and summary generation via advanced LLMs."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-secondary" />}
              title="VISUAL_DASHBOARD"
              desc="Unified data visualization for simplified decision making and trend tracking."
            />
          </div>
        </section>

        {/* Incoming Signals (Hot Contests) */}
        <section className="py-20">
          <div className="flex items-center gap-4 mb-12">
            <span className="text-accent font-bold">// INCOMING_SIGNALS</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-r from-canvas via-transparent to-canvas z-10 pointer-events-none md:hidden" />
             <div className="grid md:grid-cols-3 gap-6">
                {/* Mock Data for Landing Page */}
                <ContestCardMock 
                  title="2025 Global AI Agents Challenge"
                  platform="ModelScope"
                  prize="¥500,000"
                  daysLeft={12}
                  tags={["Agents", "LLM"]}
                />
                <ContestCardMock 
                  title="GenAI Video Production Contest"
                  platform="Civitai"
                  prize="$10,000"
                  daysLeft={3}
                  tags={["Video", "Stable Diffusion"]}
                />
                 <ContestCardMock 
                  title="Medical Imaging Diagnosis"
                  platform="Kaggle"
                  prize="$50,000"
                  daysLeft={25}
                  tags={["CV", "Healthcare"]}
                />
             </div>
             
             <div className="flex justify-center mt-12">
                <Link href="/hub" className="text-text-muted hover:text-primary underline decoration-dotted underline-offset-4">
                  View All Incoming Signals &gt;&gt;
                </Link>
             </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/30 py-8 bg-surface/30">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-text-muted">
          <div>
            &copy; 2025 AI_NAV. SYSTEM ONLINE.
          </div>
          <div className="mt-4 md:mt-0">
             Open Source Intelligence. Built with Next.js.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-surface/50 border border-border p-6 rounded-md hover:border-primary/50 transition-colors group">
      <div className="mb-4 bg-canvas/50 w-14 h-14 flex items-center justify-center rounded-md group-hover:scale-110 transition-transform duration-300 border border-border">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text-main mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function ContestCardMock({ title, platform, prize, daysLeft, tags }: { title: string, platform: string, prize: string, daysLeft: number, tags: string[] }) {
  return (
    <div className="bg-surface border border-border p-5 rounded-md hover:border-secondary hover:shadow-[0_0_15px_rgba(100,149,237,0.1)] transition-all group cursor-pointer relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
         <Terminal className="w-24 h-24 rotate-12" />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
         <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 uppercase tracking-wider">
           {platform}
         </span>
         <span className={`text-xs font-bold ${daysLeft < 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
            T-{daysLeft} DAYS
         </span>
      </div>

      <h3 className="text-lg font-bold text-text-main mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors relative z-10">
        {title}
      </h3>

      <div className="flex items-center gap-2 mb-4 relative z-10">
         <span className="text-accent font-bold text-sm tracking-wide">
           PRIZE: {prize}
         </span>
      </div>

      <div className="flex gap-2 relative z-10">
         {tags.map(tag => (
           <span key={tag} className="text-[10px] uppercase px-2 py-1 bg-primary/10 text-secondary rounded border border-primary/20">
             #{tag}
           </span>
         ))}
      </div>
    </div>
  )
}
