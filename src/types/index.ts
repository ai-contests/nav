/**
 * 核心数据类型定义
 * AI竞赛导航站点 - 数据结构定义
 */

// ==================== 竞赛数据模型 ====================

/**
 * 处理后的竞赛数据结构
 */
export interface ProcessedContest {
  // 基础标识
  id: string; // 唯一标识
  title: string; // 竞赛标题
  platform: string; // 来源平台
  url: string; // 竞赛链接

  // 内容信息
  description: string; // 详细描述
  summary?: string; // AI生成摘要（可选）

  // 分类信息
  contestType: 'image' | 'video' | 'audio' | 'text' | 'code' | 'mixed';
  status: 'active' | 'upcoming' | 'ended';
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // 时间和奖励
  deadline?: string; // 截止时间（ISO字符串）
  registrationEnd?: string; // 报名截止时间
  prize?: string; // 奖金描述（简单字符串）

  // 扩展信息
  tags: string[]; // 标签（比赛、类型、主题、工具等）
  aiTools?: string[]; // 推荐AI工具
  requirements?: string[]; // 参赛要求
  organizerInfo?: {
    // 主办方信息
    name: string;
    website?: string;
    contact?: string;
  };

  // 元数据
  qualityScore: number; // 1-10质量评分
  processedAt: string; // 处理时间
  scrapedAt: string; // 抓取时间
  lastUpdated: string; // 最后更新时间
  version: number; // 数据版本号
}

/**
 * 原始竞赛数据结构
 */
export interface RawContest {
  platform: string;
  title?: string;
  description?: string;
  url?: string;
  deadline?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'upcoming' | 'ended' | 'cancelled';
  prize?: string;
  rawHtml?: string; // 保留原始HTML用于调试
  scrapedAt: string;
  metadata: Record<string, unknown>; // 额外抓取的数据
}

// ==================== 平台配置 ====================

/**
 * 平台配置接口
 */
export interface PlatformConfig {
  // 基础信息
  name: string; // 平台名称
  displayName: string; // 显示名称
  baseUrl: string; // 基础URL
  contestListUrl: string; // 竞赛列表页

  // 抓取配置
  selectors: {
    contestItems: string; // 竞赛项目选择器
    title: string; // 标题选择器
    description?: string; // 描述选择器（可选）
    deadline?: string; // 截止日期选择器（可选）
    prize?: string; // 奖金选择器（可选）
    link: string; // 链接选择器
  };

  // 简单控制
  enabled: boolean; // 是否启用
  delay: number; // 请求延迟（秒）
  maxRetries: number; // 最大重试次数
}

/**
 * 爬取任务接口
 */
export interface CrawlTask {
  platformName: string; // 平台名称
  url: string; // 目标URL
  selectors: PlatformConfig['selectors']; // 选择器配置
  config: PlatformConfig; // 平台配置
  taskId: string; // 任务ID
  createdAt: string; // 创建时间
  priority: number; // 任务优先级 (1-10)
}

// ==================== AI处理相关 ====================

/**
 * AI处理配置
 */
export interface AIProcessorConfig {
  apiEndpoint: string; // ModelScope API端点
  apiKey?: string; // API密钥（如需要）
  maxTokens: number; // 最大token数
  batchSize: number; // 批处理大小
  modelName?: string; // 模型名称
}

/**
 * AI处理结果
 */
export interface AIProcessResult {
  contestType: string; // 识别的竞赛类型
  difficulty: string; // 评估的难度
  summary: string; // 生成的摘要
  tags: string[]; // 提取的标签
  aiTools: string[]; // 推荐的工具
  qualityScore: number; // 质量评分
  confidence: number; // 置信度
}

// ==================== 数据验证相关 ====================

/**
 * 验证规则接口
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
 * 验证问题
 */
export interface ValidationIssue {
  index: number;
  contest: string;
  issues: string[];
}

/**
 * 验证结果
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

// ==================== 存储相关 ====================

/**
 * 存储配置
 */
export interface StorageConfig {
  dataDir: string; // 数据目录
  enableGitLFS: boolean; // 是否启用Git LFS
  maxFileSize: number; // 最大文件大小（MB）
  backupCount: number; // 备份文件数量
}

/**
 * 存储结果
 */
export interface StorageResult {
  success: boolean;
  filePath?: string;
  message: string;
  contestCount?: number;
}

// ==================== 网站生成相关 ====================

/**
 * 网站配置
 */
export interface SiteConfig {
  title: string; // 网站标题
  description: string; // 网站描述
  pageSize: number; // 每页显示数量
  enableBanner: boolean; // 是否显示Banner
  bannerContent?: string; // Banner内容
}

/**
 * 页面数据
 */
export interface PageData {
  contests: ProcessedContest[];
  totalCount: number;
  lastUpdate: string;
  platforms: string[];
  contestTypes: string[];
}

// ==================== 主程序配置 ====================

/**
 * 主程序配置
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
 * 执行结果
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
 * 执行统计
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
 * 应用配置
 */
export interface AppConfig {
  sources: PlatformConfig[]; // 平台配置
  aiProcessor: AIProcessorConfig; // AI处理配置
  storage: StorageConfig; // 存储配置
  site: SiteConfig; // 网站配置
  enableValidation?: boolean; // 是否启用验证
  schedule: {
    crawlInterval: number; // 爬取间隔（小时）
    enableAutoRun: boolean; // 是否自动运行
  };
}

// ==================== 接口定义 ====================

/**
 * 爬虫接口
 */
export interface ContestScraper {
  platform: string;
  scrape(): Promise<RawContest[]>;
}

/**
 * AI处理器接口
 */
export interface AIProcessor {
  process(rawContests: RawContest[]): Promise<ProcessedContest[]>;
  processOne(rawContest: RawContest): Promise<AIProcessResult>;
}

/**
 * 存储器接口
 */
export interface ContestStorage {
  save(contests: ProcessedContest[], platform: string): Promise<StorageResult>;
  load(platform?: string): Promise<ProcessedContest[]>;
  getLatest(): Promise<ProcessedContest[]>;
}

/**
 * 网站生成器接口
 */
export interface SiteGenerator {
  generate(contests: ProcessedContest[]): Promise<void>;
  generateIndex(pageData: PageData): Promise<string>;
  generateDetail(contest: ProcessedContest): Promise<string>;
}

/**
 * 主应用接口
 */
export interface ContestApp {
  run(): Promise<ExecutionResult>;
  crawl(): Promise<RawContest[]>;
  process(rawContests: RawContest[]): Promise<ProcessedContest[]>;
  generateSite(contests: ProcessedContest[]): Promise<void>;
}

// ==================== 错误处理 ====================

/**
 * 错误类型
 */
export type ErrorType =
  | 'NETWORK'
  | 'PARSING'
  | 'AI_PROCESSING'
  | 'STORAGE'
  | 'VALIDATION'
  | 'RATE_LIMIT';

/**
 * 应用错误
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
 * 重试策略
 */
export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number; // 初始延迟（毫秒）
  backoffMultiplier: number; // 退避倍数
  maxDelay: number; // 最大延迟
  retryableErrors: ErrorType[]; // 可重试的错误类型
}
