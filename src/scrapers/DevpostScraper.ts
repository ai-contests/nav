import { EnhancedScraper } from './EnhancedScraper';
import { RawContest } from '../types';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

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
                 } catch (e: unknown) {
                     const errorMessage = e instanceof Error ? e.message : String(e);
                     logger.warn(`Failed to enrich Devpost contest ${contest.title}`, { error: errorMessage });
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
        const $ = cheerio.load(html);
        const contests: RawContest[] = [];

        // Devpost hackathon tiles
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            $el.find('.theme-label').each((_: number, t: any) => { themes.push($(t).text().trim()); });

            if (title && url) {
                // Calculate rough deadline from time left if possible, or leave undefined for AI enrichment
                
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
        const $ = cheerio.load(html);
        
        // Description
        const desc = $('#challenge-overview').text().trim() || $('.hyphenate').first().text().trim();
        if (desc) contest.description = this.cleanText(desc);

        // Tags
        const tags: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $('#built-with li').each((_: number, el: any) => { tags.push($(el).text().trim()); });
        if (tags.length > 0) contest.metadata = { ...contest.metadata, stack: tags };
    }
}
