import { EnhancedScraper } from './EnhancedScraper';
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';

export class DevpostScraper extends EnhancedScraper {
    get platform(): string {
        return 'devpost';
    }

    async scrape(): Promise<RawContest[]> {
        logger.info(`Starting scrape for ${this.platform}`, { url: this.config.contestListUrl });
        
        try {
            // Devpost uses client-side rendering for the hackathon list.
            // Using Puppeteer to fetch rendered HTML, waiting for the contest items to appear.
            const html = await this.fetchHtmlWithPuppeteer(
                this.config.contestListUrl, 
                this.config.selectors.contestItems
            );
            
            const contests = this.extractContestDataList(html);
            
            logger.info(`Parsed ${contests.length} contests from Devpost HTML`);
            
            // Enrich details
            const enrichedContests: RawContest[] = [];
            for (const contest of contests.slice(0, 10)) { // Limit to 10 for now to be polite
                 try {
                    await this.applyDelay();
                    if (contest.url) {
                        const detailHtml = await this.fetchHtml(contest.url);
                        this.enrichContestDetails(contest, detailHtml);
                    }
                    if (this.validateContest(contest)) {
                        enrichedContests.push(contest);
                    }
                 } catch (e: any) {
                     logger.warn(`Failed to enrich Devpost contest ${contest.title}`, { error: e.message || e });
                     // Push basic version if enrichment fails
                     if (this.validateContest(contest)) enrichedContests.push(contest);
                 }
            }
            
            return enrichedContests;
        } catch (error) {
             logger.error(`Failed to scrape ${this.platform}`, { error });
             throw error;
        }
    }

    private extractContestDataList(html: string): RawContest[] {
        const $ = this.loadHtml(html);
        const contests: RawContest[] = [];

        // Devpost hackathon tiles
        $('.hackathon-tile').each((_: number, el: any) => {
            const $el = $(el);
            
            const title = $el.find('.main-content h3').text().trim();
            const url = $el.find('a.tile-anchor').attr('href') || $el.find('a').attr('href') || '';
            const statusText = $el.find('.status-label').text().trim();
            const timeLeft = $el.find('.time-left').text().trim();
            const submissionCount = $el.find('.participants strong').text().trim();
            const prize = $el.find('.prize-amount').text().trim(); // Note: Often empty on list view if "Multiple Prizes"
            const thumbnail = $el.find('.side-feature img').attr('src') || $el.find('.hackathon-thumbnail').attr('src');
            
            // Themes/Tags
            const themes: string[] = [];
            $el.find('.theme-label').each((_: number, t: any) => themes.push($(t).text().trim()));

            if (title && url) {
                // Calculate rough deadline from time left if possible, or leave undefined for AI enrichment
                // "28 days left"
                let deadline: string | undefined;
                if (timeLeft.includes('left')) {
                     // Very rough estimation, better to parse specific date from detail page if available.
                     // But list page usually gives relative time.
                }

                contests.push({
                    platform: this.platform,
                    title,
                    url,
                    description: '', // Will get from details
                    prize: prize || 'See Details',
                    rawHtml: $el.html() || '',
                    scrapedAt: new Date().toISOString(),
                    metadata: {
                        status: statusText,
                        timeLeft,
                        submissionCount,
                        thumbnail,
                        themes
                    }
                });
            }
        });
        
        return contests;
    }

    private enrichContestDetails(contest: RawContest, html: string) {
        const $ = this.loadHtml(html);
        
        // Description
        const desc = $('#challenge-overview').text().trim() || $('.hyphenate').first().text().trim();
        if (desc) contest.description = this.cleanText(desc);

        // Tags
        const tags: string[] = [];
        $('#built-with li').each((_: number, el: any) => tags.push($(el).text().trim()));
        if (tags.length > 0) contest.metadata = { ...contest.metadata, stack: tags };
    }

    // Helper to load cheerio (since base class doesn't expose it directly as a public method, but we can import it)
    private loadHtml(html: string) {
        // We need to import cheerio dynamically or statically. 
        // Assuming cheerio is in dependencies.
        const cheerio = require('cheerio');
        return cheerio.load(html);
    }
}
