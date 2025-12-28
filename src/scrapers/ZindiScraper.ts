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
      const validContests = contests.filter(contest =>
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
   */
  private parseZindiContests(html: string): RawContest[] {
    const $ = cheerio.load(html);
    const contests: RawContest[] = [];

    // Find competition cards - Zindi uses various card structures
    $(this.config.selectors.contestItems).each((_index, element) => {
      try {
        const $card = $(element);

        // Extract title - try multiple selectors
        const title = $card.find('h3, h4, .title, [class*="title"]').first().text().trim() ||
                      $card.find('a').first().text().trim();

        // Extract URL
        let url = $card.find('a').first().attr('href') || '';
        if (url && !url.startsWith('http')) {
          url = `https://zindi.africa${url}`;
        }

        // Get card text for parsing
        const cardText = $card.text();

        // Extract description
        const description = $card.find('p, .description, [class*="description"]')
          .first()
          .text()
          .trim();

        // Extract prize from text patterns
        const prizeMatch = cardText.match(/\$[\d,]+|USD\s*[\d,]+|[\d,]+\s*USD/i);
        const prize = prizeMatch ? prizeMatch[0] : undefined;

        // Extract time/deadline patterns
        const timeMatch = cardText.match(/(\d+)\s*(days?|weeks?|months?)\s*(left|remaining)/i);
        let deadline: string | undefined;
        if (timeMatch) {
          const amount = parseInt(timeMatch[1], 10);
          const unit = timeMatch[2].toLowerCase();
          const deadlineDate = new Date();
          
          if (unit.startsWith('day')) {
            deadlineDate.setDate(deadlineDate.getDate() + amount);
          } else if (unit.startsWith('week')) {
            deadlineDate.setDate(deadlineDate.getDate() + amount * 7);
          } else if (unit.startsWith('month')) {
            deadlineDate.setMonth(deadlineDate.getMonth() + amount);
          }
          
          deadline = deadlineDate.toISOString();
        }

        // Determine status
        let status: 'active' | 'upcoming' | 'ended' = 'active';
        const lowerText = cardText.toLowerCase();
        if (lowerText.includes('ended') || lowerText.includes('closed') || lowerText.includes('completed')) {
          status = 'ended';
        } else if (lowerText.includes('coming soon') || lowerText.includes('upcoming')) {
          status = 'upcoming';
        }

        // Extract type/category
        const typeMatch = cardText.match(/prize|practice|knowledge|hiring/i);
        const competitionType = typeMatch ? typeMatch[0].toLowerCase() : undefined;

        if (title && url && title.length > 3) {
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
              competitionType,
              timeLeft: timeMatch ? `${timeMatch[1]} ${timeMatch[2]}` : undefined,
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
