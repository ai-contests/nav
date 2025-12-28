/**
 * DrivenData platform scraper
 * Scrapes social impact AI/ML competitions from DrivenData.org
 */

import { EnhancedScraper } from './EnhancedScraper';
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

export class DrivenDataScraper extends EnhancedScraper {
  constructor(config: PlatformConfig) {
    super(config);
  }

  get platform(): string {
    return 'drivendata';
  }

  /**
   * Scrape contests from DrivenData platform
   */
  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting scrape for ${this.platform}`, {
      url: this.config.contestListUrl,
    });

    try {
      await this.applyDelay();

      // DrivenData may use some JS, use Puppeteer for consistency
      const html = await this.fetchHtmlWithPuppeteer(
        this.config.contestListUrl,
        this.config.selectors.contestItems
      );

      const contests = this.parseDrivenDataContests(html);
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
   * Parse contest data from DrivenData HTML
   */
  private parseDrivenDataContests(html: string): RawContest[] {
    const $ = cheerio.load(html);
    const contests: RawContest[] = [];

    // Find all competition titles
    $(this.config.selectors.contestItems).each((_index, element) => {
      try {
        const $title = $(element);
        
        // Get the card container (parent elements)
        const $card = $title.closest('div').parent().closest('div');
        
        // Extract title
        const title = $title.text().trim();
        
        // Extract URL from the link
        const $link = $title.closest('a');
        let url = $link.attr('href') || '';
        if (url && !url.startsWith('http')) {
          url = `https://www.drivendata.org${url}`;
        }

        // Get the card text for parsing metadata
        const cardText = $card.text();

        // Extract category
        const $category = $card.find('a.text-category, .category');
        const category = $category.text().trim();

        // Extract description (first paragraph after title)
        const $desc = $card.find('p').first();
        const description = $desc.text().trim();

        // Extract prize from "in prizes" pattern
        const prizeMatch = cardText.match(/\$[\d,]+(?:\s+in\s+prizes)?/i);
        const prize = prizeMatch ? prizeMatch[0].replace(/\s+in\s+prizes/i, '') : undefined;

        // Extract time left from "X weeks/days left" pattern
        const timeMatch = cardText.match(/(\d+)\s*(weeks?|days?|months?)\s*left/i);
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

        // Extract participants count
        const participantsMatch = cardText.match(/([\d,]+)\s*joined/i);
        const participants = participantsMatch 
          ? parseInt(participantsMatch[1].replace(/,/g, ''), 10) 
          : undefined;

        // Determine status based on section or text
        let status: 'active' | 'upcoming' | 'ended' = 'active';
        if (cardText.toLowerCase().includes('ended') || 
            cardText.toLowerCase().includes('completed')) {
          status = 'ended';
        } else if (cardText.toLowerCase().includes('coming soon')) {
          status = 'upcoming';
        }

        if (title && url) {
          contests.push({
            title,
            url,
            platform: this.platform,
            description: description || category || undefined,
            deadline,
            prize,
            status,
            scrapedAt: new Date().toISOString(),
            metadata: {
              category,
              participants,
              timeLeft: timeMatch ? `${timeMatch[1]} ${timeMatch[2]}` : undefined,
            },
          });
        }
      } catch (error) {
        logger.warn('Failed to parse DrivenData contest card', { error });
      }
    });

    logger.info(`Parsed ${contests.length} contests from DrivenData`);
    return contests;
  }
}
