/**
 * Mock AI Processor for testing
 * Simulates AI processing without external API calls
 */

import {
  RawContest,
  ProcessedContest,
  AIProcessorConfig,
  AIProcessResult,
} from '../types';
import { logger } from '../utils/logger';
import { generateId } from '../utils';

export class MockAIProcessor {
  private config: AIProcessorConfig;

  constructor(config: AIProcessorConfig) {
    this.config = config;
  }

  /**
   * Process multiple raw contests
   */
  async processContests(
    rawContests: RawContest[]
  ): Promise<ProcessedContest[]> {
    logger.info(`Mock AI processing ${rawContests.length} contests`);

    const processed: ProcessedContest[] = [];

    for (const contest of rawContests) {
      try {
        const processedContest = await this.processContest(contest);
        processed.push(processedContest);
      } catch (error) {
        logger.error(`Failed to process contest: ${contest.title}`, { error });
        processed.push(this.createFallbackContest(contest));
      }
    }

    logger.info(
      `Mock AI processing completed. Processed ${processed.length} contests`
    );
    return processed;
  }

  /**
   * Process a single raw contest
   */
  async processContest(rawContest: RawContest): Promise<ProcessedContest> {
    // Simulate processing delay
    await this.delay(100);

    const aiResult = this.getMockAnalysis(rawContest);

    const processed: ProcessedContest = {
      id: generateId('contest'),
      title: rawContest.title || 'Untitled Contest',
      platform: rawContest.platform,
      url: rawContest.url || '',

      description: rawContest.description || '',
      summary: aiResult.summary,

      contestType: this.mapContestType(aiResult.contestType),
      status: this.mapStatus(rawContest.status),
      difficulty: this.mapDifficulty(aiResult.difficulty),

      deadline: rawContest.deadline,
      prize: rawContest.prize,

      tags: aiResult.tags,
      aiTools: aiResult.aiTools,
      requirements: this.extractRequirements(rawContest.description || ''),

      qualityScore: aiResult.qualityScore,
      processedAt: new Date().toISOString(),
      scrapedAt: rawContest.scrapedAt,
      lastUpdated: new Date().toISOString(),
      version: 1,
    };

    return processed;
  }

  /**
   * Get mock AI analysis
   */
  private getMockAnalysis(contest: RawContest): AIProcessResult {
    const title = contest.title?.toLowerCase() || '';
    const description = contest.description?.toLowerCase() || '';
    const content = `${title} ${description}`;

    // Mock classification based on keywords
    let contestType = 'mixed';
    if (
      content.includes('图像') ||
      content.includes('image') ||
      content.includes('vision')
    ) {
      contestType = 'image';
    } else if (
      content.includes('nlp') ||
      content.includes('语言') ||
      content.includes('text')
    ) {
      contestType = 'text';
    } else if (content.includes('video') || content.includes('视频')) {
      contestType = 'video';
    } else if (content.includes('audio') || content.includes('语音')) {
      contestType = 'audio';
    } else if (content.includes('code') || content.includes('代码')) {
      contestType = 'code';
    }

    // Mock difficulty assessment
    let difficulty = 'intermediate';
    if (content.includes('初级') || content.includes('beginner')) {
      difficulty = 'beginner';
    } else if (
      content.includes('高级') ||
      content.includes('advanced') ||
      content.includes('专业')
    ) {
      difficulty = 'advanced';
    }

    // Mock tags based on content
    const tags: string[] = [];
    const tagMap = {
      ai: ['ai', 'artificial-intelligence'],
      机器学习: ['machine-learning'],
      深度学习: ['deep-learning'],
      nlp: ['nlp', 'natural-language-processing'],
      图像: ['computer-vision', 'image-processing'],
      python: ['python'],
      pytorch: ['pytorch'],
      tensorflow: ['tensorflow'],
    };

    for (const [keyword, keywordTags] of Object.entries(tagMap)) {
      if (content.includes(keyword.toLowerCase())) {
        tags.push(...keywordTags);
      }
    }

    // Default tags if none found
    if (tags.length === 0) {
      tags.push('ai', 'competition', 'machine-learning');
    }

    // Mock AI tools
    const aiTools = ['Python', 'Jupyter Notebook'];
    if (contestType === 'image') {
      aiTools.push('Stable Diffusion', 'DALL-E', 'Midjourney');
    } else if (contestType === 'text') {
      aiTools.push('Transformers', 'OpenAI GPT', 'BERT');
    }

    // Mock summary
    const summary = `${contest.title || 'AI Competition'}: ${(contest.description || '').substring(0, 100)}...`;

    return {
      contestType,
      difficulty,
      summary,
      tags: [...new Set(tags)], // Remove duplicates
      aiTools: [...new Set(aiTools)],
      qualityScore: 7, // Mock good quality
      confidence: 0.8, // High confidence for mock data
    };
  }

  /**
   * Map contest type to valid enum value
   */
  private mapContestType(
    type: string
  ): 'image' | 'video' | 'audio' | 'text' | 'code' | 'mixed' {
    const validTypes = ['image', 'video', 'audio', 'text', 'code', 'mixed'];
    return validTypes.includes(type) ? (type as any) : 'mixed';
  }

  /**
   * Map status to valid enum value
   */
  private mapStatus(status?: string): 'active' | 'upcoming' | 'ended' {
    if (!status) return 'active';

    const normalizedStatus = status.toLowerCase();
    if (
      normalizedStatus.includes('upcoming') ||
      normalizedStatus.includes('未开始')
    ) {
      return 'upcoming';
    } else if (
      normalizedStatus.includes('ended') ||
      normalizedStatus.includes('结束')
    ) {
      return 'ended';
    }
    return 'active';
  }

  /**
   * Map difficulty to valid enum value
   */
  private mapDifficulty(
    difficulty: string
  ): 'beginner' | 'intermediate' | 'advanced' {
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    return validDifficulties.includes(difficulty)
      ? (difficulty as any)
      : 'intermediate';
  }

  /**
   * Extract requirements from description
   */
  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];

    // Simple pattern matching for requirements
    if (description.includes('Python')) requirements.push('Python编程经验');
    if (
      description.includes('深度学习') ||
      description.includes('deep learning')
    ) {
      requirements.push('深度学习基础');
    }
    if (description.includes('GPU')) requirements.push('GPU计算资源');

    return requirements;
  }

  /**
   * Create fallback contest when processing fails
   */
  private createFallbackContest(rawContest: RawContest): ProcessedContest {
    return {
      id: generateId('contest'),
      title: rawContest.title || 'Untitled Contest',
      platform: rawContest.platform,
      url: rawContest.url || '',

      description: rawContest.description || '',
      summary: 'Contest summary not available',

      contestType: 'mixed',
      status: this.mapStatus(rawContest.status),
      difficulty: 'intermediate',

      deadline: rawContest.deadline,
      prize: rawContest.prize,

      tags: ['ai', 'competition'],
      aiTools: ['Python'],
      requirements: [],

      qualityScore: 5,
      processedAt: new Date().toISOString(),
      scrapedAt: rawContest.scrapedAt,
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
  }

  /**
   * Add delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get stats
   */
  getStats(): Record<string, any> {
    return {
      config: {
        apiEndpoint: 'mock-processor',
        maxTokens: this.config.maxTokens,
        batchSize: this.config.batchSize,
      },
      lastProcessed: new Date().toISOString(),
    };
  }
}
