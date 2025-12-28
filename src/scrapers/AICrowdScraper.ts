/**
 * AICrowd platform scraper
 * Scrapes AI/ML competition data from AICrowd.com
 */

import { EnhancedScraper } from './EnhancedScraper';
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

export class AICrowdScraper extends EnhancedScraper {
  constructor(config: PlatformConfig) {
    super(config);
  }

  get platform(): string {
    return 'aicrowd';
  }

  /**
   * Scrape contests from AICrowd platform
   */
  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting scrape for ${this.platform}`, {
      url: this.config.contestListUrl,
    });

    try {
      await this.applyDelay();

      // AICrowd uses dynamic loading, use Puppeteer
      const html = await this.fetchHtmlWithPuppeteer(
        this.config.contestListUrl,
        this.config.selectors.contestItems
      );

      const contests = this.parseAICrowdContests(html);
      const validContests = contests.filter(contest =>
        this.validateContest(contest)
      );

      // Enrich with detail page data (limit to 10 for now)
      const enrichedContests = await this.enrichContestData(
        validContests.slice(0, 10)
      );

      logger.info(
        `Successfully scraped ${enrichedContests.length} contests from ${this.platform}`
      );

      return enrichedContests;
    } catch (error) {
      logger.error(`Failed to scrape ${this.platform}`, { error });
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Parse contest data from AICrowd HTML
   */
  private parseAICrowdContests(html: string): RawContest[] {
    const $ = cheerio.load(html);
    const contests: RawContest[] = [];

    // Select challenge cards
    $(this.config.selectors.contestItems).each((_index, element) => {
      try {
        const $card = $(element);

        // Extract title and URL from card-title link
        const titleLink = $card.find('.card-title a, a.card-img-overlay').first();
        const title = titleLink.text().trim() || 
                      $card.find('.card-title').text().trim();
        
        let url = titleLink.attr('href') || '';
        if (url && !url.startsWith('http')) {
          url = `https://www.aicrowd.com${url}`;
        }

        // Extract deadline/status from badge
        const statusBadge = $card.find('.badge, .card-img-overlay span').first();
        const statusText = statusBadge.text().trim();

        // Extract description
        const description = $card.find('.card-text, .card-intro').text().trim();

        // Extract prize from card body text
        const cardBodyText = $card.find('.card-body').text();
        const prizeMatch = cardBodyText.match(/(\$[\d,]+|USD\s*[\d,]+|[\d,]+\s*USD)/i);
        const prize = prizeMatch ? prizeMatch[0] : undefined;

        // Extract image
        const imageUrl = $card.find('img').attr('src') || '';

        // Parse status
        let status: 'active' | 'upcoming' | 'ended' = 'active';
        if (statusText.toLowerCase().includes('completed') || 
            statusText.toLowerCase().includes('ended')) {
          status = 'ended';
        } else if (statusText.toLowerCase().includes('coming') ||
                   statusText.toLowerCase().includes('starting')) {
          status = 'upcoming';
        }

        // Parse deadline from "X days left" format
        let deadline: string | undefined;
        const daysMatch = statusText.match(/(\d+)\s*days?\s*left/i);
        if (daysMatch) {
          const daysLeft = parseInt(daysMatch[1], 10);
          const deadlineDate = new Date();
          deadlineDate.setDate(deadlineDate.getDate() + daysLeft);
          deadline = deadlineDate.toISOString();
        }

        if (title && url) {
          contests.push({
            title,
            url,
            platform: this.platform,
            description: description || undefined,
            deadline,
            prize,
            status,
            scrapedAt: new Date().toISOString(),
            metadata: {
              statusText,
              imageUrl,
              cardBodyText: cardBodyText.substring(0, 200),
            },
          });
        }
      } catch (error) {
        logger.warn('Failed to parse AICrowd contest card', { error });
      }
    });

    logger.info(`Parsed ${contests.length} contests from AICrowd`);
    return contests;
  }

  /**
   * Enrich contest data with detail page information
   */
  private async enrichContestData(
    contests: RawContest[]
  ): Promise<RawContest[]> {
    const enrichedContests: RawContest[] = [];

    for (const contest of contests) {
      if (!contest.url) {
        enrichedContests.push(contest);
        continue;
      }

      try {
        await this.applyDelay();

        const detailHtml = await this.fetchHtmlWithPuppeteer(
          contest.url,
          '.challenge-description, .challenge-timeline, h1'
        );
        const $ = cheerio.load(detailHtml);

        // Get full description
        const fullDescription = 
          $('.challenge-description, .markdown-body, [class*="description"]')
            .first()
            .text()
            .trim();

        if (fullDescription && fullDescription.length > (contest.description?.length || 0)) {
          contest.description = fullDescription.substring(0, 2000);
        }

        // Try to get organizer info
        const organizer = $('[class*="organizer"], [class*="host"]')
          .first()
          .text()
          .trim();
        if (organizer) {
          contest.metadata.organizer = organizer;
        }

        // Try to get tags/categories
        const tags: string[] = [];
        $('.badge, .tag, [class*="category"]').each((_i, el) => {
          const tagText = $(el).text().trim();
          if (tagText && tagText.length < 50 && !tags.includes(tagText)) {
            tags.push(tagText);
          }
        });
        if (tags.length > 0) {
          contest.metadata.tags = tags.slice(0, 10);
        }

        enrichedContests.push(contest);
        logger.debug(`Enriched contest: ${contest.title}`);
      } catch (error) {
        logger.warn(`Failed to enrich contest: ${contest.title}`, { error });
        enrichedContests.push(contest);
      }
    }

    return enrichedContests;
  }
}
