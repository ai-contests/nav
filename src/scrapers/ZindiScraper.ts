/**
 * Zindi platform scraper
 * Scrapes African AI/ML competitions from Zindi.africa
 */

import { EnhancedScraper } from './EnhancedScraper';
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

export class ZindiScraper extends EnhancedScraper {
  constructor(config: PlatformConfig) {
    super(config);
  }

  get platform(): string {
    return 'zindi';
  }

  /**
   * Scrape contests from Zindi platform
   */
  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting scrape for ${this.platform}`, {
      url: this.config.contestListUrl,
    });

    try {
      await this.applyDelay();

      // Zindi uses dynamic content, need Puppeteer
      const html = await this.fetchHtmlWithPuppeteer(
        this.config.contestListUrl,
        this.config.selectors.contestItems
      );

      const contests = this.parseZindiContests(html);
      const validContests = contests.filter((contest) =>
        this.validateContest(contest)
      );

      logger.info(
        `Successfully scraped ${validContests.length} contests from ${this.platform}`
      );

      return validContests;
    } catch (error) {
      logger.error(`Failed to scrape ${this.platform}`, { error });
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Parse contest data from Zindi HTML
   * Zindi uses CSS Modules with hashed class names (e.g. Competition__container___9d8Mz)
   */
  private parseZindiContests(html: string): RawContest[] {
    const $ = cheerio.load(html);
    const contests: RawContest[] = [];

    // Find competition cards using partial class match
    $('div[class*="Competition__container"]').each((_index, element) => {
      try {
        const $card = $(element);

        // Extract title from Competition__title
        const title = $card
          .find('div[class*="Competition__title"]')
          .first()
          .text()
          .trim();

        // Extract URL from link inside the card or parent a tag
        let url =
          $card.find('a[href^="/competitions/"]').first().attr('href') ||
          $card.parent('a').attr('href') ||
          '';
        if (url && !url.startsWith('http')) {
          url = `https://zindi.africa${url}`;
        }

        // Extract deadline/time info from Competition__dates
        const datesText = $card
          .find('div[class*="Competition__dates"]')
          .text()
          .trim();
        let deadline: string | undefined;
        let status: 'active' | 'upcoming' | 'ended' = 'active';

        // Parse time patterns
        const daysLeftMatch = datesText.match(/(\d+)\s*days?\s*left/i);
        const startsInMatch = datesText.match(/starts\s*in\s*(\d+)\s*days?/i);

        if (
          datesText.toLowerCase().includes('challenge completed') ||
          datesText.toLowerCase().includes('closed')
        ) {
          status = 'ended';
        } else if (startsInMatch) {
          status = 'upcoming';
          const daysUntil = parseInt(startsInMatch[1], 10);
          const deadlineDate = new Date();
          deadlineDate.setDate(deadlineDate.getDate() + daysUntil);
          deadline = deadlineDate.toISOString();
        } else if (daysLeftMatch) {
          status = 'active';
          const daysLeft = parseInt(daysLeftMatch[1], 10);
          const deadlineDate = new Date();
          deadlineDate.setDate(deadlineDate.getDate() + daysLeft);
          deadline = deadlineDate.toISOString();
        }

        // Extract prize from Competition__right (contains prize amount like "$3 500 USD")
        const prizeText = $card
          .find('div[class*="Competition__right"]')
          .text()
          .trim();
        const prizeMatch = prizeText.match(
          /[$€£][\s\d,]+(?:USD|EUR|ZAR)?|[\d,]+\s*(?:USD|EUR|ZAR)/i
        );
        const prize = prizeMatch ? prizeMatch[0].trim() : undefined;

        // Description might be in Competition__blurb (only for some cards)
        const description =
          $card.find('div[class*="Competition__blurb"]').text().trim() ||
          undefined;

        if (title && url && title.length > 3) {
          contests.push({
            title,
            url,
            platform: this.platform,
            description,
            deadline,
            prize,
            status,
            scrapedAt: new Date().toISOString(),
            metadata: {
              timeInfo: datesText,
            },
          });
        }
      } catch (error) {
        logger.warn('Failed to parse Zindi contest card', { error });
      }
    });

    logger.info(`Parsed ${contests.length} contests from Zindi`);
    return contests;
  }
}
