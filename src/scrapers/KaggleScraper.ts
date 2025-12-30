/**
 * Kaggle platform scraper
 * Uses official Kaggle API to fetch competition data
 * 
 * Requires KAGGLE_USERNAME and KAGGLE_KEY environment variables
 * Get your API token from https://www.kaggle.com/settings/account -> API -> Create New Token
 */

import axios from 'axios';
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';
import { BaseScraper } from './BaseScraper';

interface KaggleCompetition {
  ref: string;
  title: string;
  url: string;
  description: string;
  organizationName: string;
  organizationRef: string;
  category: string;
  reward: string;
  deadline: string;
  kernelCount: number;
  teamCount: number;
  userHasEntered: boolean;
  enabledDate: string;
  maxTeamSize: number;
  evaluationMetric: string;
  isKernelsSubmissionsOnly: boolean;
  tags: { ref: string; name: string }[];
}

export class KaggleScraper extends BaseScraper {
  private username: string;
  private apiKey: string;

  constructor(config: PlatformConfig) {
    super(config);
    this.username = process.env.KAGGLE_USERNAME || '';
    this.apiKey = process.env.KAGGLE_KEY || '';
  }

  get platform(): string {
    return 'kaggle';
  }

  /**
   * Check if Kaggle API credentials are configured
   */
  private hasCredentials(): boolean {
    return !!(this.username && this.apiKey);
  }

  /**
   * Get Basic Auth header for Kaggle API
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.username}:${this.apiKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Scrape competitions from Kaggle API
   */
  async scrape(): Promise<RawContest[]> {
    if (!this.hasCredentials()) {
      logger.warn('Kaggle API credentials not configured. Set KAGGLE_USERNAME and KAGGLE_KEY environment variables.');
      logger.info('Get your API token from https://www.kaggle.com/settings/account -> API -> Create New Token');
      return [];
    }

    logger.info(`Starting scrape for ${this.platform} via API`, {
      url: 'https://www.kaggle.com/api/v1/competitions/list',
    });

    try {
      const allContests: RawContest[] = [];
      
      // Fetch active competitions
      const activeContests = await this.fetchCompetitions('active');
      allContests.push(...activeContests);

      // Optionally fetch featured competitions
      const featuredContests = await this.fetchCompetitions('featured');
      // Deduplicate by ref
      const existingRefs = new Set(allContests.map(c => c.metadata?.ref));
      for (const contest of featuredContests) {
        if (!existingRefs.has(contest.metadata?.ref)) {
          allContests.push(contest);
        }
      }

      logger.info(`Successfully scraped ${allContests.length} contests from ${this.platform}`);
      return allContests;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          logger.error('Kaggle API authentication failed. Check KAGGLE_USERNAME and KAGGLE_KEY.');
        } else if (error.response?.status === 403) {
          logger.error('Kaggle API access forbidden. API credentials may be invalid.');
        } else {
          logger.error(`Kaggle API error: ${error.response?.status} ${error.response?.statusText}`);
        }
      }
      logger.error(`Failed to scrape ${this.platform}`, {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error
      });
      throw error;
    }
  }

  /**
   * Fetch competitions from Kaggle API
   */
  private async fetchCompetitions(category: string = 'active'): Promise<RawContest[]> {
    const contests: RawContest[] = [];
    let page = 1;
    const pageSize = 20;
    let hasMore = true;

    while (hasMore && page <= 5) { // Limit to 5 pages (100 competitions max)
      try {
        const response = await axios.get('https://www.kaggle.com/api/v1/competitions/list', {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
          params: {
            category,
            sortBy: 'latestDeadline',
            page,
          },
          timeout: 30000,
        });

        const competitions: KaggleCompetition[] = response.data || [];
        
        if (competitions.length === 0) {
          hasMore = false;
          break;
        }

        logger.info(`Fetched page ${page}: ${competitions.length} competitions (category: ${category})`);

        for (const comp of competitions) {
          contests.push(this.mapToRawContest(comp));
        }

        if (competitions.length < pageSize) {
          hasMore = false;
        }

        page++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        logger.error(`Failed to fetch page ${page}`, { error });
        hasMore = false;
      }
    }

    return contests;
  }

  /**
   * Map Kaggle competition to RawContest
   */
  private mapToRawContest(comp: KaggleCompetition): RawContest {
    // Construct full URL
    const url = comp.url.startsWith('http') 
      ? comp.url 
      : `https://www.kaggle.com${comp.url}`;

    // Determine status based on deadline
    let status: 'active' | 'upcoming' | 'ended' = 'active';
    const deadline = comp.deadline ? new Date(comp.deadline) : null;
    const now = new Date();
    const enabledDate = comp.enabledDate ? new Date(comp.enabledDate) : null;

    if (deadline && deadline < now) {
      status = 'ended';
    } else if (enabledDate && enabledDate > now) {
      status = 'upcoming';
    }

    // Extract tags
    const tags = comp.tags?.map(t => t.name) || [];
    if (comp.category) {
      tags.unshift(comp.category);
    }

    return {
      platform: this.platform,
      title: comp.title || '',
      description: comp.description || '',
      url,
      deadline: deadline?.toISOString(),
      prize: comp.reward || undefined,
      status,
      rawHtml: '',
      scrapedAt: new Date().toISOString(),
      metadata: {
        ref: comp.ref,
        category: comp.category,
        organizationName: comp.organizationName,
        teamCount: comp.teamCount,
        kernelCount: comp.kernelCount,
        maxTeamSize: comp.maxTeamSize,
        evaluationMetric: comp.evaluationMetric,
        isKernelsOnly: comp.isKernelsSubmissionsOnly,
        enabledDate: comp.enabledDate,
        tags,
      },
    };
  }

  /**
   * Validate Kaggle contest
   */
  protected validateContest(contest: RawContest): boolean {
    if (!contest.title || contest.title.length < 3) {
      return false;
    }

    if (!contest.url || !contest.url.includes('kaggle.com')) {
      return false;
    }

    return true;
  }
}

