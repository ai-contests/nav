export const metadata = {
    title: 'FAQ | AI_NAV_',
};

export default function FAQPage() {
    return (
        <article>
            <h1>Frequently Asked Questions</h1>
            
            <h3>How often is data updated?</h3>
            <p>
                The Global Scan module runs every 6 hours to fetch fresh data from all supported source nodes.
            </p>

            <h3>Is this platform free?</h3>
            <p>
                Yes, AI_NAV_ is currently in open beta and completely free for all operatives.
            </p>

            <h3>How can I add a new contest?</h3>
            <p>
                Our scrapers automatically detect new contests. If a contest is missing, you can submit a manual signal interception request via our GitHub repository.
            </p>
        </article>
    );
}
