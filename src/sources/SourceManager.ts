/**
 * Data source management module
 * Responsible for maintaining target platform list and scraping rules
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { PlatformConfig, CrawlTask } from '../types';

export class SourceManager {
  private configPath: string;
  private platforms: Map<string, PlatformConfig>;

  constructor(
    configPathOrPlatforms: string | PlatformConfig[] = 'config/sources.json'
  ) {
    if (typeof configPathOrPlatforms === 'string') {
      this.configPath = configPathOrPlatforms;
      this.platforms = new Map();
      this.loadConfig();
    } else {
      // Initialize with provided platform configs
      this.configPath = '';
      this.platforms = new Map();
      configPathOrPlatforms.forEach(platform => {
        this.platforms.set(platform.name, platform);
      });
    }
  }

  /**
   * Load platform configuration
   */
  async loadConfig(): Promise<void> {
    try {
      if (!this.configPath) return;
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJson(this.configPath);
        this.platforms = this.parseConfig(configData);
      } else {
        // If config file doesn't exist, create default config
        await this.createDefaultConfig();
      }
    } catch (error) {
      throw new Error(`Failed to load config file: ${error}`);
    }
  }

  /**
   * Save platform configuration
   */
  async saveConfig(): Promise<void> {
    try {
      if (!this.configPath) return;
      const configData = this.serializeConfig();
      const configDir = path.dirname(this.configPath);

      await fs.ensureDir(configDir);
      await fs.writeJson(this.configPath, configData, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save config file: ${error}`);
    }
  }

  /**
   * Add platform configuration
   */
  async addPlatform(platform: PlatformConfig): Promise<void> {
    const errors = this.validateConfig(platform);
    if (errors.length > 0) {
      throw new Error(`Config validation failed: ${errors.join(', ')}`);
    }

    this.platforms.set(platform.name, platform);
    await this.saveConfig();
  }

  /**
   * Remove platform configuration
   */
  async removePlatform(platformName: string): Promise<boolean> {
    const deleted = this.platforms.delete(platformName);
    if (deleted) {
      await this.saveConfig();
    }
    return deleted;
  }

  /**
   * Update platform configuration
   */
  async updatePlatform(
    platformName: string,
    updates: Partial<PlatformConfig>
  ): Promise<boolean> {
    const platform = this.platforms.get(platformName);
    if (!platform) {
      return false;
    }

    const updatedPlatform = { ...platform, ...updates };
    const errors = this.validateConfig(updatedPlatform);
    if (errors.length > 0) {
      throw new Error(`Config validation failed: ${errors.join(', ')}`);
    }

    this.platforms.set(platformName, updatedPlatform);
    await this.saveConfig();
    return true;
  }

  /**
   * Get platform configuration
   */
  getPlatform(platformName: string): PlatformConfig | undefined {
    return this.platforms.get(platformName);
  }

  /**
   * List platform configurations
   */
  listPlatforms(enabledOnly = true): PlatformConfig[] {
    const platforms = Array.from(this.platforms.values());
    return enabledOnly ? platforms.filter(p => p.enabled) : platforms;
  }

  /**
   * Generate crawl task list
   */
  generateCrawlTasks(platformNames?: string[]): CrawlTask[] {
    const tasks: CrawlTask[] = [];
    let platforms = this.listPlatforms(true);

    if (platformNames) {
      platforms = platforms.filter(p => platformNames.includes(p.name));
    }

    for (const platform of platforms) {
      const task: CrawlTask = {
        platformName: platform.name,
        url: platform.contestListUrl,
        selectors: platform.selectors,
        config: platform,
        taskId: `${platform.name}_${new Date().toISOString().replace(/[:.]/g, '_')}`,
        createdAt: new Date().toISOString(),
        priority: 1,
      };
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Validate platform configuration
   */
  validateConfig(platformConfig: PlatformConfig): string[] {
    const errors: string[] = [];

    if (!platformConfig.name) {
      errors.push('Platform name cannot be empty');
    }

    if (!platformConfig.baseUrl) {
      errors.push('Base URL cannot be empty');
    }

    if (!platformConfig.contestListUrl) {
      errors.push('Contest list URL cannot be empty');
    }

    // selectors may be undefined in test fixtures; guard access
    if (!platformConfig.selectors || !platformConfig.selectors.contestItems) {
      errors.push('Contest items selector cannot be empty');
    }

    if (!platformConfig.selectors || !platformConfig.selectors.title) {
      errors.push('Title selector cannot be empty');
    }

    if (!platformConfig.selectors || !platformConfig.selectors.link) {
      errors.push('Link selector cannot be empty');
    }

    // Validate URL format
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(platformConfig.baseUrl)) {
      errors.push('Base URL format is incorrect');
    }
    if (!urlRegex.test(platformConfig.contestListUrl)) {
      errors.push('Contest list URL format is incorrect');
    }

    return errors;
  }

  /**
   * Parse configuration data
   */
  private parseConfig(
    configData: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Map<string, PlatformConfig> {
    const platforms = new Map<string, PlatformConfig>();

    if (
      configData &&
      typeof configData === 'object' &&
      'platforms' in configData &&
      configData.platforms &&
      typeof configData.platforms === 'object'
    ) {
      for (const [name, data] of Object.entries(configData.platforms)) {
        const platformData = data as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        const platform: PlatformConfig = {
          name,
          displayName:
            platformData.displayName || platformData.display_name || name,
          baseUrl: platformData.baseUrl || platformData.base_url || '',
          contestListUrl:
            platformData.contestListUrl || platformData.contest_list_url || '',
          selectors: {
            contestItems:
              platformData.selectors?.contestItems ||
              platformData.selectors?.contest_items ||
              '',
            title: platformData.selectors?.title || '',
            description: platformData.selectors?.description,
            deadline: platformData.selectors?.deadline,
            prize: platformData.selectors?.prize,
            link: platformData.selectors?.link || '',
          },
          enabled: platformData.enabled !== false,
          delay: platformData.delay || 2.0,
          maxRetries: platformData.maxRetries || platformData.max_retries || 3,
        };

        platforms.set(name, platform);
      }
    }

    return platforms;
  }

  /**
   * Serialize configuration data
   */
  private serializeConfig(): unknown {
    const configData: Record<string, unknown> = {
      platforms: {},
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };

    this.platforms.forEach((platform, name) => {
      (configData.platforms as Record<string, unknown>)[name] = {
        displayName: platform.displayName,
        baseUrl: platform.baseUrl,
        contestListUrl: platform.contestListUrl,
        selectors: {
          contestItems: platform.selectors.contestItems,
          title: platform.selectors.title,
          description: platform.selectors.description,
          deadline: platform.selectors.deadline,
          prize: platform.selectors.prize,
          link: platform.selectors.link,
        },
        enabled: platform.enabled,
        delay: platform.delay,
        maxRetries: platform.maxRetries,
      };
    });

    return configData;
  }

  /**
   * Create default configuration
   */
  private async createDefaultConfig(): Promise<void> {
    const defaultPlatforms: PlatformConfig[] = [
      {
        name: 'modelscope',
        displayName: 'ModelScope',
        baseUrl: 'https://modelscope.cn',
        contestListUrl: 'https://modelscope.cn/competitions',
        selectors: {
          contestItems: '.competition-item',
          title: '.competition-title',
          description: '.competition-desc',
          deadline: '.deadline',
          prize: '.prize-info',
          link: 'a[href]',
        },
        enabled: true,
        delay: 2.0,
        maxRetries: 3,
      },
      {
        name: 'civitai',
        displayName: 'Civitai',
        baseUrl: 'https://civitai.com',
        contestListUrl: 'https://civitai.com/events',
        selectors: {
          contestItems: 'a[href^="/events/"], [data-testid="event-card"]',
          title: 'h3',
          description: '.event-description',
          deadline: '.event-deadline',
          prize: '.prize-amount',
          link: 'a[href]',
        },
        enabled: true,
        delay: 1.5,
        maxRetries: 3,
      },
      {
        name: 'openart',
        displayName: 'OpenArt',
        baseUrl: 'https://openart.ai',
        contestListUrl: 'https://contest.openart.ai',
        selectors: {
          contestItems: '.contest-card',
          title: '.contest-title',
          description: '.contest-description',
          deadline: '.contest-deadline',
          prize: '.prize-amount',
          link: 'a[href]',
        },
        enabled: true,
        delay: 1.0,
        maxRetries: 3,
      },
    ];

    // Add default platforms
    for (const platform of defaultPlatforms) {
      this.platforms.set(platform.name, platform);
    }

    await this.saveConfig();
  }

  /**
   * Get enabled platform names
   */
  getEnabledPlatforms(): string[] {
    return Array.from(this.platforms.values())
      .filter(platform => platform.enabled)
      .map(platform => platform.name);
  }

  /**
   * Get all platform names
   */
  getAllPlatforms(): string[] {
    return Array.from(this.platforms.keys());
  }

  /**
   * Check if platform is enabled
   */
  isPlatformEnabled(name: string): boolean {
    const platform = this.platforms.get(name);
    return platform ? platform.enabled : false;
  }
}
