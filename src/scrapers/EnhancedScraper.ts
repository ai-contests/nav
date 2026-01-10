/**
 * Enhanced scraper with Puppeteer support for dynamic content
 */

import puppeteer from 'puppeteer-extra';
import { Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { BaseScraper } from './BaseScraper';
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';

// Add stealth plugin
puppeteer.use(StealthPlugin());

export class EnhancedScraper extends BaseScraper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected browser: any | null = null;
  protected headless: boolean = true;

  constructor(config: PlatformConfig, userAgent?: string, timeout = 30000) {
    super(config, userAgent, timeout);
  }

  get platform(): string {
    return 'enhanced';
  }

  /**
   * Initialize Puppeteer browser with Stealth mode
   */
  async initBrowser(): Promise<void> {
    if (this.browser) return;

    try {
      this.browser = await puppeteer.launch({
        headless: this.headless, // Use new headless mode (default true)
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process', // Often helps with frames
          '--disable-blink-features=AutomationControlled', // Critical for anti-bot
        ],
        timeout: this.timeout,
      });
      logger.info('Puppeteer browser initialized (Stealth Mode)');
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to initialize browser', {
          message: error.message,
          stack: error.stack,
        });
      } else {
        logger.error('Failed to initialize browser', { error });
      }
      throw error;
    }
  }

  /**
   * Close Puppeteer browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  /**
   * Fetch HTML using Puppeteer for dynamic content
   */
  protected async fetchHtmlWithPuppeteer(
    url: string,
    waitForSelector?: string
  ): Promise<string> {
    await this.initBrowser();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    try {
      // Set user agent
      await page.setUserAgent(this.userAgent);

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to the page
      logger.info(`Navigating to ${url}`);
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.timeout,
      });

      // Wait for specific selector if provided
      if (waitForSelector) {
        try {
          await page.waitForSelector(waitForSelector, { timeout: 5000 });
        } catch (error) {
          logger.warn(
            `Selector ${waitForSelector} not found, continuing anyway`
          );
        }
      }

      // Wait longer for dynamic content to load (especially for SPA)
      await new Promise((r) => setTimeout(r, 5000));

      // Auto-scroll to bottom to trigger lazy loading if any
      try {
        await autoScroll(page);
        // Wait after scrolling for content to load
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        logger.warn('Auto-scroll failed, continuing without scrolling');
      }

      // Get HTML content
      const html = await page.content();

      return html;
    } finally {
      await page.close();
    }
  }

  /**
   * Enhanced scrape method - should be overridden by specific scrapers
   */
  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting enhanced scrape for ${this.platform}`, {
      url: this.config.contestListUrl,
    });

    try {
      await this.applyDelay();

      // Try Puppeteer first for dynamic content
      let html: string;
      try {
        html = await this.fetchHtmlWithPuppeteer(this.config.contestListUrl);
        logger.info('Successfully fetched HTML with Puppeteer');
      } catch (error) {
        logger.warn('Puppeteer failed, falling back to basic HTTP', { error });
        html = await this.fetchHtml(this.config.contestListUrl);
      }

      const contests = this.parseContests(html);
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
   * Enhanced contest parsing with better error handling
   */
  protected parseContests(html: string): RawContest[] {
    const $ = cheerio.load(html);
    const contests: RawContest[] = [];

    // Debug: log page structure
    logger.debug('Page structure debug info', {
      title: $('title').text(),
      bodyText: `${$('body').text().substring(0, 200)}...`,
      itemsFound: $(this.config.selectors.contestItems).length,
    });

    const contestItems = $(this.config.selectors.contestItems);
    logger.info(`Found ${contestItems.length} potential contest items`);

    // Diagnostic: save small samples of the first few matched nodes to data for debugging
    try {
      const outDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      const samples: string[] = [];
      const nodes = contestItems.get().slice(0, 3);
      for (const node of nodes) {
        try {
          const outer = $.html(node) || '';
          samples.push(outer.substring(0, 1000)); // truncate long HTML
        } catch (e) {
          // ignore
        }
      }

      const out = {
        timestamp: new Date().toISOString(),
        selector: this.config.selectors.contestItems,
        itemsFound: contestItems.length,
        samples,
      };

      const outPath = path.join(outDir, `debug-parse-samples-enhanced.json`);
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
      logger.info(`Wrote parse samples to ${outPath}`);
    } catch (e) {
      logger.warn('Failed to write parse samples', { error: e });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contestItems.each((index: number, element: any) => {
      try {
        const $element = $(element);
        const contest = this.extractContestData($element, $);

        // More lenient validation - just need a title OR description
        if (contest.title || contest.description) {
          contests.push(contest);
          logger.debug(`Extracted contest ${index + 1}`, {
            title: contest.title?.substring(0, 50),
            url: contest.url,
            hasDescription: !!contest.description,
          });
        } else {
          logger.debug(
            `Skipped contest ${index + 1} - no title or description`
          );
        }
      } catch (error) {
        logger.warn(`Failed to parse contest item ${index}`, { error });
      }
    });

    logger.info(
      `Successfully parsed ${contests.length} contests from ${contestItems.length} items`
    );
    return contests;
  }

  /**
   * Enhanced contest data extraction with more flexible selectors
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractContestData($element: any, _$: any): RawContest {
    // Try multiple selector patterns for each field
    const title = this.extractTextFlexible($element, [
      this.config.selectors.title,
      'h1, h2, h3, h4, h5, h6',
      '.title, [class*="title"]',
      '.name, [class*="name"]',
    ]);

    const description = this.extractTextFlexible($element, [
      this.config.selectors.description,
      '.description, [class*="description"]',
      '.content, [class*="content"]',
      '.summary, [class*="summary"]',
      'p',
    ]);

    const deadline = this.extractTextFlexible($element, [
      this.config.selectors.deadline,
      '.deadline, [class*="deadline"]',
      '.date, [class*="date"]',
      '.time, [class*="time"]',
    ]);

    const prize = this.extractTextFlexible($element, [
      this.config.selectors.prize,
      '.prize, [class*="prize"]',
      '.reward, [class*="reward"]',
      '.award, [class*="award"]',
    ]);

    // Extract URL
    let url = '';
    const linkElement = $element.find('a[href]').first();
    if (linkElement.length > 0) {
      url = linkElement.attr('href') || '';

      // Convert relative URLs to absolute URLs
      if (url && !url.startsWith('http')) {
        if (url.startsWith('/')) {
          url = `${this.config.baseUrl}${url}`;
        } else {
          url = `${this.config.baseUrl}/${url}`;
        }
      }
    }

    const contest: RawContest = {
      platform: this.platform,
      title: this.cleanText(title || ''),
      description: this.cleanText(description || ''),
      url,
      deadline: deadline?.trim(),
      prize: this.cleanText(prize || ''),
      rawHtml: $element.html() || '',
      scrapedAt: new Date().toISOString(),
      metadata: this.extractMetadata($element),
    };

    return contest;
  }

  /**
   * Try multiple selectors to extract text
   */
  protected extractTextFlexible(
    $element: cheerio.Cheerio<unknown>,
    selectors: (string | undefined)[]
  ): string | undefined {
    for (const selector of selectors) {
      if (!selector) continue;

      try {
        const text = this.extractText($element, selector);
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    return undefined;
  }

  /**
   * Cleanup method to ensure browser is closed
   */
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}

/**
 * Auto-scroll helper for Puppeteer pages to trigger lazy loading
 */
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const maxScrolls = 150; // Limit scrolling to avoid timeouts (~30s)
      let currentScroll = 0;

      const timer = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scrollHeight = (document as any).body.scrollHeight;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).scrollBy(0, distance);
        totalHeight += distance;
        currentScroll++;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (
          totalHeight >= scrollHeight - (window as any).innerHeight ||
          currentScroll >= maxScrolls
        ) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}
