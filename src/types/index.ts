/**
 * Core Data Type Definitions
 * AI Contest Navigator - Data Structure Definitions
 */

// ==================== Contest Data Models ====================

/**
 * Processed Contest Data Structure
 */
export interface ProcessedContest {
  // Basic Identifiers
  id: string; // Unique Identifier
  title: string; // Contest Title
  platform: string; // Source Platform
  url: string; // Contest URL
  imageUrl?: string; // Contest Image URL

  // Content Information
  description: string; // Detailed Description
  summary?: string; // AI Generated Summary (Optional)

  // Category Information
  contestType: 'image' | 'video' | 'audio' | 'text' | 'code' | 'mixed';
  status: 'active' | 'upcoming' | 'ended';
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // Time and Prizes
  deadline?: string; // Deadline (ISO String)
  registrationEnd?: string; // Registration End Time
  prize?: string; // Prize Description (Simple String)

  // Extended Information
  tags: string[]; // Tags (Contest, Type, Topic, Tools, etc.)
  aiTools?: string[]; // Recommended AI Tools
  requirements?: string[]; // Participation Requirements
  organizerInfo?: {
    // Organizer Information
    name: string;
    website?: string;
    contact?: string;
  };

  // Metadata
  qualityScore: number; // 1-10 Quality Score
  processedAt: string; // Processed Time
  scrapedAt: string; // Scraped Time
  lastUpdated: string; // Last Updated Time
  version: number; // Data Version Number
}

/**
 * Raw Contest Data Structure
 */
export interface RawContest {
  platform: string;
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string; // Contest Image URL
  deadline?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'upcoming' | 'ended' | 'cancelled';
  prize?: string;
  rawHtml?: string; // Keep raw HTML for debugging
  scrapedAt: string;
  metadata: Record<string, unknown>; // Extra scraped data
}

// ==================== Platform Configuration ====================

/**
 * Platform Configuration Interface
 */
export interface PlatformConfig {
  // Basic Information
  name: string; // Platform Name
  displayName: string; // Display Name
  baseUrl: string; // Base URL
  contestListUrl: string; // Contest List Page URL

  // Scraping Configuration
  selectors: {
    contestItems: string; // Contest Items Selector
    title: string; // Title Selector
    description?: string; // Description Selector (Optional)
    deadline?: string; // Deadline Selector (Optional)
    prize?: string; // Prize Selector (Optional)
    link: string; // Link Selector
  };

  // Simple Controls
  enabled: boolean; // Is Enabled
  delay: number; // Request Delay (Seconds)
  maxRetries: number; // Max Retries
}

/**
 * Crawl Task Interface
 */
export interface CrawlTask {
  platformName: string; // Platform Name
  url: string; // Target URL
  selectors: PlatformConfig['selectors']; // Selector Configuration
  config: PlatformConfig; // Platform Configuration
  taskId: string; // Task ID
  createdAt: string; // Created Time
  priority: number; // Task Priority (1-10)
}

// ==================== AI Processing Related ====================

/**
 * AI Processing Configuration
 */
export interface AIProcessorConfig {
  apiEndpoint: string; // ModelScope API Endpoint
  apiKey?: string; // API Key (If needed)
  maxTokens: number; // Max Tokens
  batchSize: number; // Batch Size
  modelName?: string; // Model Name
}

/**
 * AI Process Result
 */
export interface AIProcessResult {
  contestType: string; // Identified Contest Type
  difficulty: string; // Assessed Difficulty
  summary: string; // Generated Summary
  tags: string[]; // Extracted Tags
  aiTools: string[]; // Recommended Tools
  qualityScore: number; // Quality Score
  confidence: number; // Confidence Score
}

// ==================== Data Validation Related ====================

/**
 * Validation Rule Interface
 */
export interface ValidationRule {
  name: string;
  description: string;
  validator: (
    contest: RawContest,
    index: number,
    allContests?: RawContest[]
  ) => Promise<{ errors?: string[]; warnings?: string[] }>;
}

/**
 * Validation Issue
 */
export interface ValidationIssue {
  index: number;
  contest: string;
  issues: string[];
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    totalContests: number;
    validContests: number;
    invalidContests: number;
    warningContests: number;
  };
}

// ==================== Storage Related ====================

/**
 * Storage Configuration
 */
export interface StorageConfig {
  dataDir: string; // Data Directory
  enableGitLFS: boolean; // Enable Git LFS
  maxFileSize: number; // Max File Size (MB)
  backupCount: number; // Backup Count
}

/**
 * Storage Result
 */
export interface StorageResult {
  success: boolean;
  filePath?: string;
  message: string;
  contestCount?: number;
}

// ==================== Site Generation Related ====================

/**
 * Site Configuration
 */
export interface SiteConfig {
  title: string; // Site Title
  description: string; // Site Description
  pageSize: number; // Items Per Page
  enableBanner: boolean; // Enable Banner
  bannerContent?: string; // Banner Content
}

/**
 * Page Data
 */
export interface PageData {
  contests: ProcessedContest[];
  totalCount: number;
  lastUpdate: string;
  platforms: string[];
  contestTypes: string[];
}

// ==================== Main Program Configuration ====================

/**
 * Main Program Configuration
 */
export interface MainConfig {
  mode: 'full' | 'crawl-only' | 'process-only' | 'generate-only';
  enableValidation: boolean;
  enableHealthCheck: boolean;
  maxConcurrency: number;
  timeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Execution Result
 */
export interface ExecutionResult {
  success: boolean;
  duration: number;
  startTime: string;
  endTime: string;
  stats: ExecutionStats;
  errors: string[];
  warnings: string[];
}

/**
 * Execution Stats
 */
export interface ExecutionStats {
  crawled: number;
  processed: number;
  validated: number;
  generated: number;
  saved: number;
  errors: number;
  warnings: number;
}

/**
 * App Configuration
 */
export interface AppConfig {
  sources: PlatformConfig[]; // Platform Configs
  aiProcessor: AIProcessorConfig; // AI Processor Config
  storage: StorageConfig; // Storage Config
  site: SiteConfig; // Site Config
  enableValidation?: boolean; // Is Validation Enabled
  schedule: {
    crawlInterval: number; // Crawl Interval (Hours)
    enableAutoRun: boolean; // Enable Auto Run
  };
  notifications?: {
    enabled: boolean;
    fromEmail: string;
    toEmails: string[];
  };
}

// ==================== Interface Definitions ====================

/**
 * Scraper Interface
 */
export interface ContestScraper {
  platform: string;
  scrape(): Promise<RawContest[]>;
}

/**
 * AI Processor Interface
 */
export interface AIProcessor {
  process(rawContests: RawContest[]): Promise<ProcessedContest[]>;
  processOne(rawContest: RawContest): Promise<AIProcessResult>;
}

/**
 * Storage Interface
 */
export interface ContestStorage {
  save(contests: ProcessedContest[], platform: string): Promise<StorageResult>;
  load(platform?: string): Promise<ProcessedContest[]>;
  getLatest(): Promise<ProcessedContest[]>;
}

/**
 * Site Generator Interface
 */
export interface SiteGenerator {
  generate(contests: ProcessedContest[]): Promise<void>;
  generateIndex(pageData: PageData): Promise<string>;
  generateDetail(contest: ProcessedContest): Promise<string>;
}

/**
 * Contest App Interface
 */
export interface ContestApp {
  run(): Promise<ExecutionResult>;
  crawl(): Promise<RawContest[]>;
  process(rawContests: RawContest[]): Promise<ProcessedContest[]>;
  generateSite(contests: ProcessedContest[]): Promise<void>;
}

// ==================== Error Handling ====================

/**
 * Error Type
 */
export type ErrorType =
  | 'NETWORK'
  | 'PARSING'
  | 'AI_PROCESSING'
  | 'STORAGE'
  | 'VALIDATION'
  | 'RATE_LIMIT';

/**
 * App Error
 */
export interface AppError {
  type: ErrorType;
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  context?: Record<string, unknown>;
  retry?: boolean;
}

/**
 * Retry Policy
 */
export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number; // Initial Delay (ms)
  backoffMultiplier: number; // Backoff Multiplier
  maxDelay: number; // Max Delay
  retryableErrors: ErrorType[]; // Retryable Error Types
}
