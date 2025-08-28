/**
 * Base scraper class for all platform scrapers
 * Provides common functionality for web scraping
 */

import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { RawContest, PlatformConfig, ContestScraper } from '../types';

export abstract class BaseScraper implements ContestScraper {
  protected config: PlatformConfig;
  protected userAgent: string;
  protected timeout: number;

  constructor(config: PlatformConfig, userAgent?: string, timeout = 30000) {
    this.config = config;
    this.userAgent =
      userAgent || 'Mozilla/5.0 (compatible; AI-Contest-Bot/1.0)';
    this.timeout = timeout;
  }

  abstract get platform(): string;

  /**
   * Main scraping method to be implemented by subclasses
   */
  abstract scrape(): Promise<RawContest[]>;

  /**
   * Fetch HTML content from URL with retry logic
   */
  protected async fetchHtml(url: string, retries?: number): Promise<string> {
    const maxRetries = retries || this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response: AxiosResponse = await axios.get(url, {
          headers: {
            'User-Agent': this.userAgent,
          },
          timeout: this.timeout,
        });

        if (response.status === 200) {
          return response.data;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Attempt ${attempt}/${maxRetries} failed for ${url}:`,
          error
        );

        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to fetch ${url} after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Parse HTML and extract contest data using selectors
   */
  protected parseContests(html: string): RawContest[] {
    const $ = cheerio.load(html);
    const contests: RawContest[] = [];
    const contestItems = $(this.config.selectors.contestItems);

    contestItems.each((index, element) => {
      try {
        const $element = $(element);
        const contest = this.extractContestData($element, $);

        if (contest.title && contest.url) {
          contests.push(contest);
        }
      } catch (error) {
        console.warn(`Failed to parse contest item ${index}:`, error);
      }
    });

    return contests;
  }

  /**
   * Extract contest data from a single element
   */
  protected extractContestData(
    $element: cheerio.Cheerio<any>,
    $: cheerio.CheerioAPI
  ): RawContest {
    const title = this.extractText($element, this.config.selectors.title);
    const description = this.extractText(
      $element,
      this.config.selectors.description
    );
    const deadline = this.extractText($element, this.config.selectors.deadline);
    const prize = this.extractText($element, this.config.selectors.prize);

    // Extract URL
    let url = '';
    // If the element itself is an <a>, prefer its href
    if ($element.is('a')) {
      url = $element.attr('href') || '';
    }

    if (!url && this.config.selectors.link) {
      const linkElement = $element.find(this.config.selectors.link).first();
      url = linkElement.attr('href') || '';
    }

    // Convert relative URLs to absolute URLs
    if (url && !url.startsWith('http')) {
      try {
        url = new URL(url, this.config.baseUrl).toString();
      } catch (e) {
        // fallback: prefix baseUrl
        if (url.startsWith('/')) {
          url = `${this.config.baseUrl}${url}`;
        } else {
          url = `${this.config.baseUrl}/${url}`;
        }
      }
    }

    const contest: RawContest = {
      platform: this.platform,
      title: title?.trim(),
      description: description?.trim(),
      url,
      deadline: deadline?.trim(),
      prize: prize?.trim(),
      rawHtml: $element.html() || '',
      scrapedAt: new Date().toISOString(),
      metadata: {},
    };

    return contest;
  }

  /**
   * Extract text content from element using selector
   */
  protected extractText(
    $element: cheerio.Cheerio<any>,
    selector?: string
  ): string | undefined {
    if (!selector) return undefined;

    const targetElement = $element.find(selector).first();
    return targetElement.length > 0 ? targetElement.text().trim() : undefined;
  }

  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Apply rate limiting delay
   */
  protected async applyDelay(): Promise<void> {
    const delayMs = this.config.delay * 1000;
    if (delayMs > 0) {
      await this.sleep(delayMs);
    }
  }

  /**
   * Validate scraped contest data
   */
  protected validateContest(contest: RawContest): boolean {
    if (!contest.title || contest.title.trim().length === 0) {
      return false;
    }

    if (!contest.url || !this.isValidUrl(contest.url)) {
      return false;
    }

    return true;
  }

  /**
   * Check if URL is valid
   */
  protected isValidUrl(url: string): boolean {
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(url);
  }

  /**
   * Clean and normalize text content
   */
  protected cleanText(text: string): string {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with space
      .trim();
  }

  /**
   * Extract additional metadata from element
   */
  protected extractMetadata(
    $element: cheerio.Cheerio<any>
  ): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract data attributes
    const dataAttributes = $element.get(0)?.attribs || {};
    for (const [key, value] of Object.entries(dataAttributes)) {
      if (key.startsWith('data-')) {
        metadata[key] = value;
      }
    }

    return metadata;
  }
}
