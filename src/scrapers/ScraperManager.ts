/**
 * Scraper Manager
 * Coordinates and manages all platform scrapers
 */

import { SourceManager } from '../sources/SourceManager';
import { ModelScopeScraper } from './ModelScopeScraper';
import { CivitaiScraper } from './CivitaiScraper';
import { OpenArtScraper } from './OpenArtScraper';
import { BaseScraper } from './BaseScraper';
import { RawContest, PlatformConfig, CrawlTask } from '../types';
import { logger } from '../utils/logger';
import { retry } from '../utils';

export class ScraperManager {
  private sourceManager: SourceManager | null;
  private scrapers: Map<string, BaseScraper>;

  constructor(sourceManager?: SourceManager) {
    this.sourceManager = sourceManager || null;
    this.scrapers = new Map();
    if (this.sourceManager) {
      this.initializeScrapers();
    }
  }

  /**
   * Initialize scrapers for all enabled platforms
   */
  private initializeScrapers(): void {
    if (!this.sourceManager) return;

    const platforms = this.sourceManager.listPlatforms(true);

    for (const platform of platforms) {
      const scraper = this.createScraper(platform);
      if (scraper) {
        this.scrapers.set(platform.name, scraper);
        logger.info(`Initialized scraper for ${platform.name}`);
      }
    }
  }

  /**
   * Create appropriate scraper based on platform type
   */
  private createScraper(config: PlatformConfig): BaseScraper | null {
    switch (config.name.toLowerCase()) {
      case 'modelscope':
        return new ModelScopeScraper(config);
      case 'civitai':
        return new CivitaiScraper(config);
      case 'openart':
        return new OpenArtScraper(config);
      default:
        logger.warn(
          `No scraper implementation found for platform: ${config.name}`
        );
        return null;
    }
  }

  /**
   * Scrape all enabled platforms
   */
  async scrapeAll(maxConcurrency = 3): Promise<Map<string, RawContest[]>> {
    const results = new Map<string, RawContest[]>();
    const scrapers = Array.from(this.scrapers.entries());

    logger.info(
      `Starting scrape for ${scrapers.length} platforms with concurrency: ${maxConcurrency}`
    );

    // Process scrapers in batches to respect concurrency limits
    for (let i = 0; i < scrapers.length; i += maxConcurrency) {
      const batch = scrapers.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(([platformName, scraper]) =>
        this.scrapeWithRetry(platformName, scraper)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Process batch results
      batchResults.forEach((result, index) => {
        const [platformName] = batch[index];

        if (result.status === 'fulfilled') {
          results.set(platformName, result.value);
          logger.info(
            `Successfully scraped ${result.value.length} contests from ${platformName}`
          );
        } else {
          logger.error(`Failed to scrape ${platformName}`, {
            error: result.reason,
          });
          results.set(platformName, []);
        }
      });
    }

    const totalContests = Array.from(results.values()).reduce(
      (sum, contests) => sum + contests.length,
      0
    );
    logger.info(`Scraping completed. Total contests: ${totalContests}`);

    return results;
  }

  /**
   * Scrape specific platforms
   */
  async scrapeSpecific(
    platformNames: string[]
  ): Promise<Map<string, RawContest[]>> {
    const results = new Map<string, RawContest[]>();

    for (const platformName of platformNames) {
      const scraper = this.scrapers.get(platformName);

      if (!scraper) {
        logger.warn(`No scraper found for platform: ${platformName}`);
        results.set(platformName, []);
        continue;
      }

      try {
        const contests = await this.scrapeWithRetry(platformName, scraper);
        results.set(platformName, contests);
      } catch (error) {
        logger.error(`Failed to scrape ${platformName}`, { error });
        results.set(platformName, []);
      }
    }

    return results;
  }

  /**
   * Scrape with retry for a specific task
   */
  async scrapeTask(task: CrawlTask): Promise<RawContest[]> {
    const scraper = this.scrapers.get(task.platformName);
    if (!scraper) {
      throw new Error(`No scraper found for platform: ${task.platformName}`);
    }

    return await this.scrapeWithRetry(task.platformName, scraper);
  }

  /**
   * Scrape with retry logic
   */
  private async scrapeWithRetry(
    platformName: string,
    scraper: BaseScraper
  ): Promise<RawContest[]> {
    return retry(
      async () => {
        logger.info(`Starting scrape for ${platformName}`);
        const contests = await scraper.scrape();
        logger.info(
          `Completed scrape for ${platformName}: ${contests.length} contests`
        );
        return contests;
      },
      3, // max attempts
      2000 // base delay
    );
  }

  /**
   * Generate crawl tasks for enabled platforms
   */
  generateCrawlTasks(platformNames?: string[]): CrawlTask[] {
    if (!this.sourceManager) {
      throw new Error('SourceManager not initialized');
    }
    return this.sourceManager.generateCrawlTasks(platformNames);
  }

  /**
   * Get available platform names
   */
  getAvailablePlatforms(): string[] {
    return Array.from(this.scrapers.keys());
  }

  /**
   * Check if platform is supported
   */
  isPlatformSupported(platformName: string): boolean {
    return this.scrapers.has(platformName);
  }

  /**
   * Get scraper for specific platform
   */
  getScraper(platformName: string): BaseScraper | undefined {
    return this.scrapers.get(platformName);
  }

  /**
   * Validate all scraper configurations
   */
  validateConfigurations(): Map<string, string[]> {
    if (!this.sourceManager) {
      throw new Error('SourceManager not initialized');
    }

    const validationResults = new Map<string, string[]>();

    const platforms = this.sourceManager.listPlatforms(false); // Include disabled platforms

    for (const platform of platforms) {
      const errors = this.sourceManager.validateConfig(platform);
      validationResults.set(platform.name, errors);
    }

    return validationResults;
  }

  /**
   * Get scraping statistics
   */
  getScrapingStats(): Record<string, unknown> {
    const stats = {
      totalPlatforms: this.scrapers.size,
      enabledPlatforms: this.sourceManager
        ? this.sourceManager.listPlatforms(true).length
        : 0,
      supportedPlatforms: Array.from(this.scrapers.keys()),
      lastInitialized: new Date().toISOString(),
    };

    return stats;
  }

  /**
   * Refresh scrapers (reload configurations)
   */
  async refresh(): Promise<void> {
    if (!this.sourceManager) {
      throw new Error('SourceManager not initialized');
    }

    logger.info('Refreshing scraper configurations');

    // Clear existing scrapers
    this.scrapers.clear();

    // Reload source configurations
    await this.sourceManager.loadConfig();

    // Reinitialize scrapers
    this.initializeScrapers();

    logger.info('Scraper refresh completed');
  }

  /**
   * Health check for all scrapers
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const healthResults = new Map<string, boolean>();

    if (!this.sourceManager) {
      logger.warn('SourceManager not initialized for health check');
      return healthResults;
    }

    for (const [platformName, scraper] of this.scrapers) {
      try {
        // Simple connectivity test - try to fetch the platform's main page
        const config = this.sourceManager.getPlatform(platformName);
        if (config) {
          await (
            scraper as unknown as {
              fetchHtml: (url: string) => Promise<string>;
            }
          ).fetchHtml(config.baseUrl);
          healthResults.set(platformName, true);
        } else {
          healthResults.set(platformName, false);
        }
      } catch (error) {
        logger.warn(`Health check failed for ${platformName}`, { error });
        healthResults.set(platformName, false);
      }
    }

    return healthResults;
  }
}
