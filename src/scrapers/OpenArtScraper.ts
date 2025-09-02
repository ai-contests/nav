/**
 * OpenArt platform scraper
 * Scrapes AI contest data from OpenArt.ai
 */

import { BaseScraper } from './BaseScraper';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';

export class OpenArtScraper extends BaseScraper {
  constructor(config: PlatformConfig) {
    super(config);
  }

  get platform(): string {
    return 'openart';
  }

  /**
   * Scrape contests from OpenArt platform
   */
  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting scrape for ${this.platform}`, {
      url: this.config.contestListUrl,
    });

    try {
      await this.applyDelay();

      const html = await this.fetchHtml(this.config.contestListUrl);
      const contests = this.parseContests(html);
      const validContests = contests.filter(contest =>
        this.validateContest(contest)
      );
      const enrichedContests = await this.enrichContestData(validContests);

      logger.info(
        `Successfully scraped ${enrichedContests.length} contests from ${this.platform}`
      );

      return enrichedContests;
    } catch (error) {
      logger.error(`Failed to scrape ${this.platform}`, { error });
      throw error;
    }
  }

  /**
   * Extract contest data from OpenArt specific HTML structure
   */
  protected extractContestData($element: any, $: any): RawContest {
    const title = this.extractText($element, this.config.selectors.title);
    const description = this.extractText(
      $element,
      this.config.selectors.description
    );
    const deadline = this.extractText($element, this.config.selectors.deadline);
    const prize = this.extractText($element, this.config.selectors.prize);

    // Extract URL with OpenArt specific logic
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

    // Extract OpenArt specific metadata
    const metadata = this.extractOpenArtMetadata($element, $);

    const contest: RawContest = {
      platform: this.platform,
      title: this.cleanText(title || ''),
      description: this.cleanText(description || ''),
      url,
      deadline: this.parseOpenArtDate(deadline),
      prize: this.cleanText(prize || ''),
      rawHtml: $element.html() || '',
      scrapedAt: new Date().toISOString(),
      metadata,
    };

    return contest;
  }

  /**
   * Extract OpenArt specific metadata
   */
  private extractOpenArtMetadata($element: any, $: any): Record<string, any> {
    const metadata: Record<string, any> = {};

    try {
      // Extract contest status
      const statusElement = $element.find(
        '.status, .contest-status, [class*="status"]'
      );
      if (statusElement.length > 0) {
        metadata.status = this.cleanText(statusElement.text());
      }

      // Extract entry count
      const entryElement = $element.find(
        '.entries, .submissions, .entry-count'
      );
      if (entryElement.length > 0) {
        const entryText = entryElement.text();
        const entryMatch = entryText.match(/(\d+)/);
        if (entryMatch) {
          metadata.entryCount = parseInt(entryMatch[1], 10);
        }
      }

      // Extract contest theme/category
      const themeElement = $element.find('.theme, .category, .contest-theme');
      if (themeElement.length > 0) {
        metadata.theme = this.cleanText(themeElement.text());
      }

      // Extract sponsor information
      const sponsorElement = $element.find('.sponsor, .hosted-by, .organizer');
      if (sponsorElement.length > 0) {
        metadata.sponsor = this.cleanText(sponsorElement.text());
      }

      // Extract art style requirements
      const styleElement = $element.find('.style, .art-style, .required-style');
      if (styleElement.length > 0) {
        metadata.artStyle = this.cleanText(styleElement.text());
      }

      // Extract difficulty level
      const difficultyElement = $element.find(
        '.difficulty, .level, .skill-level'
      );
      if (difficultyElement.length > 0) {
        metadata.difficulty = this.cleanText(difficultyElement.text());
      }

      // Extract featured/trending status
      const featuredElement = $element.find('.featured, .trending, .hot');
      if (featuredElement.length > 0) {
        metadata.featured = true;
      }

      // Extract voting/rating information
      const votingElement = $element.find('.votes, .rating, .score');
      if (votingElement.length > 0) {
        const votingText = votingElement.text();
        const votingMatch = votingText.match(/(\d+(?:\.\d+)?)/);
        if (votingMatch) {
          metadata.rating = parseFloat(votingMatch[1]);
        }
      }

      // Extract tags/keywords
      const tagElements = $element.find('.tag, .keyword, .label');
      const tags: string[] = [];
      tagElements.each((_: number, tagEl: any) => {
        const tagText = $(tagEl).text().trim();
        if (tagText) {
          tags.push(tagText);
        }
      });
      if (tags.length > 0) {
        metadata.tags = tags;
      }
    } catch (error) {
      logger.warn('Failed to extract OpenArt metadata', { error });
    }

    return metadata;
  }

  /**
   * Parse OpenArt date format to ISO string
   */
  private parseOpenArtDate(dateString?: string): string | undefined {
    if (!dateString) return undefined;

    try {
      // Clean common OpenArt date patterns
      const cleanDateString = dateString
        .replace(/deadline[：:]?\s*/i, '')
        .replace(/ends?\s+/i, '')
        .replace(/submit\s+by[：:]?\s*/i, '')
        .replace(/due[：:]?\s*/i, '')
        .trim();

      // Handle "X days left" format
      const daysLeftMatch = cleanDateString.match(/(\d+)\s+days?\s+left/i);
      if (daysLeftMatch) {
        const daysLeft = parseInt(daysLeftMatch[1], 10);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysLeft);
        return futureDate.toISOString();
      }

      // Handle "X hours left" format
      const hoursLeftMatch = cleanDateString.match(/(\d+)\s+hours?\s+left/i);
      if (hoursLeftMatch) {
        const hoursLeft = parseInt(hoursLeftMatch[1], 10);
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + hoursLeft);
        return futureDate.toISOString();
      }

      // Handle standard date formats
      const date = new Date(cleanDateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      // Handle MM/DD/YYYY format
      const mmddyyyyMatch = cleanDateString.match(
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/
      );
      if (mmddyyyyMatch) {
        const [, month, day, year] = mmddyyyyMatch;
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        return date.toISOString();
      }
    } catch (error) {
      logger.warn('Failed to parse OpenArt date', { dateString, error });
    }

    return undefined;
  }

  /**
   * Enrich contest data with additional details
   */
  private async enrichContestData(
    contests: RawContest[]
  ): Promise<RawContest[]> {
    const enrichedContests: RawContest[] = [];

    for (const contest of contests) {
      try {
        await this.applyDelay();

        if (contest.url && this.isValidUrl(contest.url)) {
          const detailHtml = await this.fetchHtml(contest.url);
          const enrichedContest = await this.extractDetailedInfo(
            contest,
            detailHtml
          );
          enrichedContests.push(enrichedContest);
        } else {
          enrichedContests.push(contest);
        }
      } catch (error) {
        logger.warn(`Failed to enrich contest data for: ${contest.title}`, {
          error,
        });
        enrichedContests.push(contest);
      }
    }

    return enrichedContests;
  }

  /**
   * Extract detailed information from individual contest page
   */
  private async extractDetailedInfo(
    contest: RawContest,
    html: string
  ): Promise<RawContest> {
    try {
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);

      // Extract detailed description
      const detailedDesc = $(
        '.contest-description, .challenge-description, .full-description'
      ).text();
      if (
        detailedDesc &&
        detailedDesc.length > (contest.description || '').length
      ) {
        contest.description = this.cleanText(detailedDesc);
      }

      // Extract detailed prize breakdown
      const prizeBreakdown = $('.prize-breakdown, .awards, .prize-pool').text();
      if (
        prizeBreakdown &&
        prizeBreakdown.length > (contest.prize || '').length
      ) {
        contest.prize = this.cleanText(prizeBreakdown);
      }

      // Extract submission guidelines
      const guidelines = $(
        '.guidelines, .submission-rules, .how-to-enter'
      ).text();
      if (guidelines) {
        contest.metadata.guidelines = this.cleanText(guidelines);
      }

      // Extract judging criteria
      const judgingCriteria = $(
        '.judging-criteria, .evaluation, .scoring'
      ).text();
      if (judgingCriteria) {
        contest.metadata.judgingCriteria = this.cleanText(judgingCriteria);
      }

      // Extract technical requirements
      const techRequirements = $(
        '.tech-requirements, .requirements, .specifications'
      ).text();
      if (techRequirements) {
        contest.metadata.techRequirements = this.cleanText(techRequirements);
      }

      // Extract timeline/schedule
      const timeline = $('.timeline, .schedule, .important-dates').text();
      if (timeline) {
        contest.metadata.timeline = this.cleanText(timeline);
      }

      // Extract FAQ if available
      const faq = $('.faq, .frequently-asked, .questions').text();
      if (faq) {
        contest.metadata.faq = this.cleanText(faq);
      }
    } catch (error) {
      logger.warn('Failed to extract detailed OpenArt information', { error });
    }

    return contest;
  }

  /**
   * Validate OpenArt specific contest data
   */
  protected validateContest(contest: RawContest): boolean {
    if (!super.validateContest(contest)) {
      return false;
    }

    // OpenArt specific validations
    if (!contest.title || contest.title.length < 3) {
      logger.debug('Contest title too short', { title: contest.title });
      return false;
    }

    // Check if URL is actually an OpenArt URL
    if (contest.url && !contest.url.includes('openart.ai')) {
      logger.debug('Contest URL is not from OpenArt', { url: contest.url });
      return false;
    }

    // Filter out closed contests if status is available
    if (
      contest.metadata.status &&
      typeof contest.metadata.status === 'string' &&
      contest.metadata.status.toLowerCase().includes('closed')
    ) {
      logger.debug('Contest is closed', { title: contest.title });
      return false;
    }

    return true;
  }
}
