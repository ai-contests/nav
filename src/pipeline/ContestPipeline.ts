/**
 * Contest Pipeline
 * Main pipeline coordinator that orchestrates the entire data processing flow
 */

import { SourceManager } from '../sources/SourceManager';
import { ScraperManager } from '../scrapers/ScraperManager';
import { AIProcessor } from '../processors/AIProcessor';
import { StorageManager } from '../storage/StorageManager';
import { DataValidator } from '../validators/DataValidator';
import {
  AppConfig,
  ExecutionResult,
  ExecutionStats,
  RawContest,
  ProcessedContest,
  ValidationResult,
} from '../types';
import { logger } from '../utils/logger';

export class ContestPipeline {
  private sourceManager: SourceManager;
  private scraperManager: ScraperManager;
  private aiProcessor: AIProcessor;
  private storageManager: StorageManager;
  private dataValidator: DataValidator;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.sourceManager = new SourceManager(config.sources);
    this.scraperManager = new ScraperManager();
    this.aiProcessor = new AIProcessor(config.aiProcessor);
    this.storageManager = new StorageManager(config.storage);
    this.dataValidator = new DataValidator();
  }

  /**
   * Get enabled platform names
   */
  private getEnabledPlatforms(): string[] {
    return this.sourceManager.getEnabledPlatforms();
  }

  /**
   * Execute the complete pipeline
   */
  async execute(
    mode?: 'full' | 'crawl-only' | 'process-only' | 'generate-only'
  ): Promise<ExecutionResult> {
    const startTime = new Date();
    const stats: ExecutionStats = {
      crawled: 0,
      processed: 0,
      validated: 0,
      generated: 0,
      saved: 0,
      errors: 0,
      warnings: 0,
    };
    const errors: string[] = [];
    const warnings: string[] = [];

    logger.info(`Starting pipeline execution in ${mode || 'full'} mode`);

    try {
      let rawContests: RawContest[] = [];
      let processedContests: ProcessedContest[] = [];

      // Step 1: Data Crawling
      if (mode === 'full' || mode === 'crawl-only' || !mode) {
        try {
          logger.info('Step 1: Starting data crawling');
          rawContests = await this.crawlData();
          stats.crawled = rawContests.length;
          logger.info(`Crawled ${rawContests.length} contests`);

          // Save raw data
          for (const platform of this.getEnabledPlatforms()) {
            const platformContests = rawContests.filter(
              c => c.platform === platform
            );
            if (platformContests.length > 0) {
              const result = await this.storageManager.saveRawContests(
                platformContests,
                platform
              );
              if (!result.success) {
                errors.push(
                  `Failed to save raw data for ${platform}: ${result.message}`
                );
                stats.errors++;
              }
            }
          }
        } catch (error) {
          const errorMsg = `Data crawling failed: ${error}`;
          errors.push(errorMsg);
          stats.errors++;
          logger.error(errorMsg, { error });
        }
      }

      // Step 2: Data Validation
      if (rawContests.length > 0 && this.config.enableValidation !== false) {
        try {
          logger.info('Step 2: Validating raw data');
          const validationResult = await this.validateData(rawContests);
          stats.validated = validationResult.summary.validContests;

          if (validationResult.errors.length > 0) {
            errors.push(
              `Validation errors: ${validationResult.errors.length} contests have issues`
            );
            stats.errors += validationResult.errors.length;
          }

          if (validationResult.warnings.length > 0) {
            warnings.push(
              `Validation warnings: ${validationResult.warnings.length} contests have warnings`
            );
            stats.warnings += validationResult.warnings.length;
          }

          // Filter out invalid contests for processing
          const validIndices = new Set(
            Array.from({ length: rawContests.length }, (_, i) => i).filter(
              i => !validationResult.errors.some(e => e.index === i)
            )
          );
          rawContests = rawContests.filter((_, i) => validIndices.has(i));

          logger.info(
            `Validation completed. ${rawContests.length} valid contests will be processed`
          );
        } catch (error) {
          const errorMsg = `Data validation failed: ${error}`;
          warnings.push(errorMsg);
          stats.warnings++;
          logger.warn(errorMsg, { error });
        }
      }

      // Step 3: AI Processing
      if (
        (mode === 'full' || mode === 'process-only' || !mode) &&
        rawContests.length > 0
      ) {
        try {
          logger.info('Step 3: Processing contests with AI');
          processedContests = await this.processContests(rawContests);
          stats.processed = processedContests.length;
          logger.info(`Processed ${processedContests.length} contests`);
        } catch (error) {
          const errorMsg = `AI processing failed: ${error}`;
          errors.push(errorMsg);
          stats.errors++;
          logger.error(errorMsg, { error });
        }
      }

      // Load existing processed data if needed
      if (
        processedContests.length === 0 &&
        (mode === 'generate-only' || mode === 'process-only')
      ) {
        try {
          logger.info('Loading existing processed data');
          processedContests = await this.storageManager.loadProcessedContests();
          logger.info(
            `Loaded ${processedContests.length} existing processed contests`
          );
        } catch (error) {
          const errorMsg = `Failed to load existing data: ${error}`;
          errors.push(errorMsg);
          stats.errors++;
          logger.error(errorMsg, { error });
        }
      }

      // Step 4: Save Processed Data
      if (processedContests.length > 0 && mode !== 'generate-only') {
        try {
          logger.info('Step 4: Saving processed data');

          // Save by platform
          for (const platform of this.getEnabledPlatforms()) {
            const platformContests = processedContests.filter(
              c => c.platform === platform
            );
            if (platformContests.length > 0) {
              const result = await this.storageManager.saveProcessedContests(
                platformContests,
                platform
              );
              if (result.success) {
                stats.saved += result.contestCount || 0;
              } else {
                errors.push(
                  `Failed to save processed data for ${platform}: ${result.message}`
                );
                stats.errors++;
              }
            }
          }

          // Save consolidated data
          const consolidatedResult =
            await this.storageManager.saveProcessedContests(processedContests);
          if (!consolidatedResult.success) {
            errors.push(
              `Failed to save consolidated data: ${consolidatedResult.message}`
            );
            stats.errors++;
          }

          logger.info(`Saved ${stats.saved} processed contests`);
        } catch (error) {
          const errorMsg = `Data saving failed: ${error}`;
          errors.push(errorMsg);
          stats.errors++;
          logger.error(errorMsg, { error });
        }
      }

      // Step 5: Generate Website (placeholder for future implementation)
      if (mode === 'full' || mode === 'generate-only' || !mode) {
        try {
          logger.info('Step 5: Website generation (placeholder)');
          // TODO: Implement website generation
          stats.generated = processedContests.length;
          logger.info('Website generation completed');
        } catch (error) {
          const errorMsg = `Website generation failed: ${error}`;
          warnings.push(errorMsg);
          stats.warnings++;
          logger.warn(errorMsg, { error });
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: ExecutionResult = {
        success: errors.length === 0,
        duration,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        stats,
        errors,
        warnings,
      };

      this.logExecutionSummary(result);
      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      logger.error('Pipeline execution failed', { error });

      return {
        success: false,
        duration,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        stats,
        errors: [...errors, `Pipeline execution failed: ${error}`],
        warnings,
      };
    }
  }

  /**
   * Crawl data from all enabled platforms
   */
  private async crawlData(): Promise<RawContest[]> {
    const allContests: RawContest[] = [];

    // Generate crawl tasks
    const tasks = await this.sourceManager.generateCrawlTasks();

    if (tasks.length === 0) {
      logger.warn('No crawl tasks generated. Check platform configurations.');
      return [];
    }

    logger.info(`Generated ${tasks.length} crawl tasks`);

    // Execute tasks with scraper manager
    for (const task of tasks) {
      try {
        logger.info(`Crawling ${task.platformName}...`);
        const contests = await this.scraperManager.scrapeTask(task);

        if (contests.length > 0) {
          allContests.push(...contests);
          logger.info(
            `Successfully crawled ${contests.length} contests from ${task.platformName}`
          );
        } else {
          logger.warn(`No contests found for ${task.platformName}`);
        }
      } catch (error) {
        logger.error(`Failed to crawl ${task.platformName}`, { error });
        // Continue with other platforms
      }
    }

    logger.info(`Total crawled contests: ${allContests.length}`);
    return allContests;
  }

  /**
   * Validate scraped data
   */
  private async validateData(
    contests: RawContest[]
  ): Promise<ValidationResult> {
    const result = await this.dataValidator.validateRawContests(contests);

    // Log validation summary
    const summary = this.dataValidator.getValidationSummary(result);
    logger.info('Data validation completed', { summary });

    return result;
  }

  /**
   * Process contests with AI
   */
  private async processContests(
    rawContests: RawContest[]
  ): Promise<ProcessedContest[]> {
    return await this.aiProcessor.processContests(rawContests);
  }

  /**
   * Get pipeline status
   */
  async getStatus(): Promise<Record<string, unknown>> {
    try {
      const [storageStats, scraperStats, aiStats] = await Promise.all([
        this.storageManager.getStorageStats(),
        this.scraperManager.healthCheck(),
        Promise.resolve(this.aiProcessor.getStats()),
      ]);

      return {
        storage: storageStats,
        scrapers: scraperStats,
        aiProcessor: aiStats,
        platforms: this.getEnabledPlatforms(),
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get pipeline status', { error });
      return {
        error: `Failed to get status: ${error}`,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Cleanup old data
   */
  async cleanup(daysToKeep = 30): Promise<void> {
    try {
      logger.info(`Starting cleanup of data older than ${daysToKeep} days`);
      await this.storageManager.cleanup(daysToKeep);
      logger.info('Cleanup completed successfully');
    } catch (error) {
      logger.error('Cleanup failed', { error });
      throw error;
    }
  }

  /**
   * Export data
   */
  async exportData(format: 'json' | 'csv', platform?: string): Promise<string> {
    try {
      return await this.storageManager.exportData(format, platform);
    } catch (error) {
      logger.error('Data export failed', { error, format, platform });
      throw error;
    }
  }

  /**
   * Log execution summary
   */
  private logExecutionSummary(result: ExecutionResult): void {
    const { stats, duration, success } = result;

    logger.info(
      `
Pipeline Execution Summary:
- Status: ${success ? 'SUCCESS' : 'FAILED'}
- Duration: ${(duration / 1000).toFixed(1)}s
- Crawled: ${stats.crawled} contests
- Processed: ${stats.processed} contests  
- Validated: ${stats.validated} contests
- Saved: ${stats.saved} contests
- Generated: ${stats.generated} items
- Errors: ${stats.errors}
- Warnings: ${stats.warnings}
    `.trim()
    );

    if (result.errors.length > 0) {
      logger.error('Pipeline errors:', { errors: result.errors });
    }

    if (result.warnings.length > 0) {
      logger.warn('Pipeline warnings:', { warnings: result.warnings });
    }
  }

  /**
   * Refresh configuration
   */
  async refreshConfig(newConfig: AppConfig): Promise<void> {
    this.config = newConfig;

    // Update components with new configuration
    this.sourceManager = new SourceManager(newConfig.sources);
    this.aiProcessor = new AIProcessor(newConfig.aiProcessor);
    this.storageManager = new StorageManager(newConfig.storage);

    // Refresh scraper configurations
    await this.scraperManager.refresh();

    logger.info('Pipeline configuration refreshed');
  }
}
