export const metadata = {
    title: 'Documentation | AI_NAV_',
    description: 'Documentation for AI Contests Navigator'
};

export default function DocsPage() {
    return (
        <article>
            <h1>Introduction</h1>
            <p>
                <strong>AI_NAV_</strong> is an automated intelligence aggregator designed to scan, analyze, and index global AI competitions from multiple nodes (platforms) including Kaggle, DrivenData, ModelScope, and more.
            </p>
            
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm my-6">
                <code className="text-emerald-400">$ system_status --check</code>
                <div className="text-slate-400 text-sm mt-2">
                    &gt; AI_NAV_ CORE: ONLINE<br/>
                    &gt; DATA_CRUNLER: ACTIVE<br/>
                    &gt; UI_INTERFACE: READY
                </div>
            </div>

            <h2>Mission</h2>
            <p>
                Our mission is to reduce the latency between "signal detection" (contest announcement) and "deployment" (participation). By providing a single, unified terminal for all AI competitive signals, we empower developers to focus on pathfinding (solving) rather than reconnaissance (searching).
            </p>

            <h2>Core Features</h2>
            <ul>
                <li><strong>Global Scan</strong>: 24/7 monitoring of major competition platforms.</li>
                <li><strong>AI Analysis</strong>: Neural networks analyze contest descriptions to extract key domain tags and difficulty levels.</li>
                <li><strong>Unified Hub</strong>: One interface to filter signals by platform, reward, and technology stack.</li>
            </ul>
        </article>
    );
}
