/**
 * Main entry point for AI Contests Navigator
 * Exports core functionality for programmatic use
 */

export * from './types';
export * from './sources/SourceManager';
export * from './scrapers/BaseScraper';

// Re-export commonly used interfaces
export type {
  PlatformConfig,
  ProcessedContest,
  RawContest,
  CrawlTask,
  ExecutionResult,
  MainConfig,
  AppConfig,
} from './types';
