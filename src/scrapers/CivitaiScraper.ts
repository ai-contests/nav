/**
 * Civitai platform scraper
 * Scrapes AI competition/event data from Civitai.com
 */

import { BaseScraper } from './BaseScraper';
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';

export class CivitaiScraper extends BaseScraper {
  constructor(config: PlatformConfig) {
    super(config);
  }

  get platform(): string {
    return 'civitai';
  }

  /**
   * Scrape contests from Civitai platform
   */
  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting scrape for ${this.platform}`, { url: this.config.contestListUrl });

    try {
      await this.applyDelay();

      const html = await this.fetchHtml(this.config.contestListUrl);
      const contests = this.parseContests(html);
      const validContests = contests.filter(contest => this.validateContest(contest));
      const enrichedContests = await this.enrichContestData(validContests);

      logger.info(`Successfully scraped ${enrichedContests.length} contests from ${this.platform}`);
      
      return enrichedContests;

    } catch (error) {
      logger.error(`Failed to scrape ${this.platform}`, { error });
      throw error;
    }
  }

  /**
   * Extract contest data from Civitai specific HTML structure
   */
  protected extractContestData($element: any, $: any): RawContest {
    const title = this.extractText($element, this.config.selectors.title);
    const description = this.extractText($element, this.config.selectors.description);
    const deadline = this.extractText($element, this.config.selectors.deadline);
    const prize = this.extractText($element, this.config.selectors.prize);
    
    // Extract URL with Civitai specific logic
    let url = '';
    const linkElement = $element.find(this.config.selectors.link).first();
    if (linkElement.length > 0) {
      url = linkElement.attr('href') || '';
      
      if (url && !url.startsWith('http')) {
        if (url.startsWith('/')) {
          url = `${this.config.baseUrl}${url}`;
        } else {
          url = `${this.config.baseUrl}/${url}`;
        }
      }
    }

    // Extract Civitai specific metadata
    const metadata = this.extractCivitaiMetadata($element, $);

    const contest: RawContest = {
      platform: this.platform,
      title: this.cleanText(title || ''),
      description: this.cleanText(description || ''),
      url,
      deadline: this.parseCivitaiDate(deadline),
      prize: this.cleanText(prize || ''),
      rawHtml: $element.html() || '',
      scrapedAt: new Date().toISOString(),
      metadata
    };

    return contest;
  }

  /**
   * Extract Civitai specific metadata
   */
  private extractCivitaiMetadata($element: any, $: any): Record<string, any> {
    const metadata: Record<string, any> = {};

    try {
      // Extract event type (contest, challenge, bounty, etc.)
      const typeElement = $element.find('[data-testid*="type"], .event-type, .contest-type');
      if (typeElement.length > 0) {
        metadata.eventType = this.cleanText(typeElement.text());
      }

      // Extract submission count
      const submissionElement = $element.find('[data-testid*="submission"], .submission-count');
      if (submissionElement.length > 0) {
        const submissionText = submissionElement.text();
        const submissionMatch = submissionText.match(/(\d+)/);
        if (submissionMatch) {
          metadata.submissionCount = parseInt(submissionMatch[1], 10);
        }
      }

      // Extract model requirements/categories
      const categoryElement = $element.find('.category, .model-category, [data-category]');
      if (categoryElement.length > 0) {
        metadata.category = this.cleanText(categoryElement.text());
      }

      // Extract NSFW rating
      const nsfwElement = $element.find('[data-nsfw], .nsfw-indicator');
      if (nsfwElement.length > 0) {
        metadata.nsfw = true;
      }

      // Extract host/creator information
      const hostElement = $element.find('.host, .creator, .event-host');
      if (hostElement.length > 0) {
        metadata.host = this.cleanText(hostElement.text());
      }

      // Extract likes/popularity metrics
      const likesElement = $element.find('.likes, .thumbs-up, [data-testid*="like"]');
      if (likesElement.length > 0) {
        const likesText = likesElement.text();
        const likesMatch = likesText.match(/(\d+)/);
        if (likesMatch) {
          metadata.likes = parseInt(likesMatch[1], 10);
        }
      }

      // Extract difficulty/complexity level
      const difficultyElement = $element.find('.difficulty, .complexity');
      if (difficultyElement.length > 0) {
        metadata.difficulty = this.cleanText(difficultyElement.text());
      }

    } catch (error) {
      logger.warn('Failed to extract Civitai metadata', { error });
    }

    return metadata;
  }

  /**
   * Parse Civitai date format to ISO string
   */
  private parseCivitaiDate(dateString?: string): string | undefined {
    if (!dateString) return undefined;

    try {
      // Clean common Civitai date prefixes
      const cleanDateString = dateString
        .replace(/ends?\s+/i, '')
        .replace(/deadline[：:]?\s*/i, '')
        .replace(/due[：:]?\s*/i, '')
        .trim();

      // Handle relative dates like "in 5 days", "2 weeks left"
      const relativeDateMatch = cleanDateString.match(/(?:in\s+)?(\d+)\s+(day|week|month|hour)s?\s*(?:left)?/i);
      if (relativeDateMatch) {
        const [, amount, unit] = relativeDateMatch;
        const now = new Date();
        const multiplier = {
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000
        }[unit.toLowerCase()] || 24 * 60 * 60 * 1000;

        const futureDate = new Date(now.getTime() + parseInt(amount) * multiplier);
        return futureDate.toISOString();
      }

      // Try standard date parsing
      const date = new Date(cleanDateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

    } catch (error) {
      logger.warn('Failed to parse Civitai date', { dateString, error });
    }

    return undefined;
  }

  /**
   * Enrich contest data with additional details from individual pages
   */
  private async enrichContestData(contests: RawContest[]): Promise<RawContest[]> {
    const enrichedContests: RawContest[] = [];

    for (const contest of contests) {
      try {
        await this.applyDelay();

        if (contest.url && this.isValidUrl(contest.url)) {
          const detailHtml = await this.fetchHtml(contest.url);
          const enrichedContest = await this.extractDetailedInfo(contest, detailHtml);
          enrichedContests.push(enrichedContest);
        } else {
          enrichedContests.push(contest);
        }

      } catch (error) {
        logger.warn(`Failed to enrich contest data for: ${contest.title}`, { error });
        enrichedContests.push(contest);
      }
    }

    return enrichedContests;
  }

  /**
   * Extract detailed information from individual contest page
   */
  private async extractDetailedInfo(contest: RawContest, html: string): Promise<RawContest> {
    try {
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);

      // Extract detailed description from main content area
      const detailedDesc = $('.event-description, .content-description, main .description').text();
      if (detailedDesc && detailedDesc.length > (contest.description || '').length) {
        contest.description = this.cleanText(detailedDesc);
      }

      // Extract detailed prize information
      const prizeDetails = $('.prize-pool, .reward-details, .bounty-amount').text();
      if (prizeDetails && prizeDetails.length > (contest.prize || '').length) {
        contest.prize = this.cleanText(prizeDetails);
      }

      // Extract submission requirements
      const requirements = $('.requirements, .rules, .submission-rules').text();
      if (requirements) {
        contest.metadata.requirements = this.cleanText(requirements);
      }

      // Extract judging criteria
      const judgingCriteria = $('.judging, .criteria, .evaluation').text();
      if (judgingCriteria) {
        contest.metadata.judgingCriteria = this.cleanText(judgingCriteria);
      }

      // Extract additional model requirements
      const modelReqs = $('.model-requirements, .tech-requirements').text();
      if (modelReqs) {
        contest.metadata.modelRequirements = this.cleanText(modelReqs);
      }

      // Extract entry count from detail page
      const entryCountElement = $('.entry-count, .submission-count, .participant-count');
      if (entryCountElement.length > 0) {
        const entryText = entryCountElement.text();
        const entryMatch = entryText.match(/(\d+)/);
        if (entryMatch) {
          contest.metadata.entryCount = parseInt(entryMatch[1], 10);
        }
      }

    } catch (error) {
      logger.warn('Failed to extract detailed Civitai information', { error });
    }

    return contest;
  }

  /**
   * Validate Civitai specific contest data
   */
  protected validateContest(contest: RawContest): boolean {
    if (!super.validateContest(contest)) {
      return false;
    }

    // Civitai specific validations
    if (!contest.title || contest.title.length < 3) {
      logger.debug('Contest title too short', { title: contest.title });
      return false;
    }

    // Check if URL is actually a Civitai URL
    if (contest.url && !contest.url.includes('civitai.com')) {
      logger.debug('Contest URL is not from Civitai', { url: contest.url });
      return false;
    }

    // Filter out expired events (if we can determine the status)
    if (contest.metadata.status && 
        contest.metadata.status.toLowerCase().includes('expired')) {
      logger.debug('Contest is expired', { title: contest.title });
      return false;
    }

    return true;
  }
}
