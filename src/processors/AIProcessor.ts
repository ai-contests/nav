/**
 * AI Processor
 * Handles AI-powered content analysis and enhancement
 */

import { AIProcessorConfig, AIProcessResult, RawContest, ProcessedContest } from '../types';
import { logger } from '../utils/logger';
import { generateId } from '../utils';

import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

export class AIProcessor {
  private config: AIProcessorConfig;
  private rateLimitDelay: number = 1000; // 1 second delay between requests

  constructor(config: AIProcessorConfig) {
    this.config = config;
  }

  /**
   * Process multiple raw contests
   */
  async processContests(
    rawContests: RawContest[]
  ): Promise<ProcessedContest[]> {
    logger.info(`Starting AI processing for ${rawContests.length} contests`);

    const processed: ProcessedContest[] = [];
    const batchSize = this.config.batchSize || 5;

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < rawContests.length; i += batchSize) {
      const batch = rawContests.slice(i, i + batchSize);

      logger.info(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rawContests.length / batchSize)}`
      );

      const batchResults = await Promise.all(
        batch.map(async (contest, index) => {
          try {
            // Add delay to respect rate limits
            if (index > 0) {
              await this.delay(this.rateLimitDelay);
            }

            return await this.processContest(contest);
          } catch (error) {
            logger.error(`Failed to process contest: ${contest.title}`, {
              error,
            });
            // Return minimal processed contest on error
            return this.createFallbackContest(contest);
          }
        })
      );

      processed.push(...batchResults);
    }

    logger.info(
      `AI processing completed. Processed ${processed.length} contests`
    );
    return processed;
  }

  /**
   * Process a single raw contest
   */
  async processContest(rawContest: RawContest): Promise<ProcessedContest> {
    try {
      // Get AI analysis
      const aiResult = await this.getAIAnalysis(rawContest);

      // Create processed contest
      const processed: ProcessedContest = {
        // Generate deterministic ID based on platform and URL/Title to prevent duplicates/changes
        id: generateId('c', `${rawContest.platform}_${rawContest.url || rawContest.title || ''}`),
        title: rawContest.title || 'Untitled Contest',
        platform: rawContest.platform,
        url: rawContest.url || '',
        imageUrl: rawContest.imageUrl || '',

        // Content
        description: rawContest.description || '',
        summary: aiResult.summary,

        // Classification
        contestType: this.mapContestType(aiResult.contestType),
        status: (this.mapStatus(rawContest.status) === 'active' && !rawContest.deadline) 
                ? 'ended' 
                : this.mapStatus(rawContest.status),
        difficulty: this.mapDifficulty(aiResult.difficulty),

        // Timing and rewards
        deadline: rawContest.deadline,
        prize: rawContest.prize,

        // Enhanced information
        tags: this.refineTags(Array.from(new Set([
            ...(rawContest.metadata?.tags as string[] || []), 
            ...aiResult.tags
        ]))),
        aiTools: aiResult.aiTools,
        requirements: this.extractRequirements(rawContest.description || ''),

        // Metadata
        qualityScore: aiResult.qualityScore,
        processedAt: new Date().toISOString(),
        scrapedAt: rawContest.scrapedAt,
        lastUpdated: new Date().toISOString(),
        version: 1,
      };

      return processed;
    } catch (error) {
      logger.error(`AI processing failed for contest: ${rawContest.title}`, {
        error,
      });
      return this.createFallbackContest(rawContest);
    }
  }

  /**
   * Get AI analysis from Github Models (via Azure AI Inference SDK)
   */
  private async getAIAnalysis(contest: RawContest): Promise<AIProcessResult> {
    try {
      const prompt = this.buildAnalysisPrompt(contest);

      // Use Github Models endpoint
      const endpoint = this.config.apiEndpoint || 'https://models.github.ai/inference';
      const modelName = this.config.modelName || 'ai21-labs/AI21-Jamba-1.5-Large';
      const apiKey = this.config.apiKey || process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error('API key is missing. Please set GITHUB_TOKEN or OPENAI_API_KEY for GitHub Models.');
      }

      const client = ModelClient(
        endpoint,
        new AzureKeyCredential(apiKey)
      );

      const response = await client.path("/chat/completions").post({
        body: {
          messages: [
            {
              role: "system",
              content: "You are an AI contest analysis expert. Analyze contest information and provide structured output in JSON format."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: modelName,
          max_tokens: this.config.maxTokens || 1000,
          temperature: 0.1
        }
      });

      if (isUnexpected(response)) {
        throw new Error(JSON.stringify(response.body));
      }

      // Parse the AI response
      const content = response.body.choices[0].message.content || '';
      return this.parseAIResponse(content);

    } catch (error) {
      logger.warn('AI analysis failed, using fallback analysis', { error });
      return this.getFallbackAnalysis(contest);
    }
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(contest: RawContest): string {
    return `
Analyze this AI/ML contest and provide a JSON response with the following structure:

{
  "contestType": "image|video|audio|text|code|mixed",
  "difficulty": "beginner|intermediate|advanced", 
  "summary": "Brief 2-3 sentence summary in English",
  "tags": ["tag1", "tag2", "tag3", ...],
  "aiTools": ["tool1", "tool2", ...],
  "qualityScore": 1-10,
  "confidence": 0.0-1.0
}

Contest Information:
- Title: ${contest.title || 'N/A'}
- Platform: ${contest.platform}
- Description: ${(contest.description || '').substring(0, 1000)}
- Deadline: ${contest.deadline || 'N/A'}
- Prize: ${contest.prize || 'N/A'}

Guidelines:
- contestType: Determine the primary type of AI/ML challenge
- difficulty: Assess based on technical requirements and complexity
- summary: Create engaging, informative summary highlighting key aspects
- tags: Extract 5-10 relevant tags (technologies, themes, domains)
- aiTools: Suggest 3-5 relevant AI tools/frameworks
- qualityScore: Rate overall contest quality (clear description, good prize, reputable platform)
- confidence: Your confidence in the analysis

Respond with valid JSON only.
    `.trim();
  }

  /**
   * Parse AI response into structured result
   */
  private parseAIResponse(response: string): AIProcessResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return {
        contestType: parsed.contestType || 'mixed',
        difficulty: parsed.difficulty || 'intermediate',
        summary: parsed.summary || 'AI/ML contest analysis not available',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        aiTools: Array.isArray(parsed.aiTools) ? parsed.aiTools : [],
        qualityScore: Math.max(
          1,
          Math.min(10, parseInt(parsed.qualityScore) || 5)
        ),
        confidence: Math.max(
          0,
          Math.min(1, parseFloat(parsed.confidence) || 0.5)
        ),
      };
    } catch (error) {
      logger.warn('Failed to parse AI response, using defaults', {
        error,
        response,
      });
      return {
        contestType: 'mixed',
        difficulty: 'intermediate',
        summary: 'Contest analysis not available',
        tags: [],
        aiTools: [],
        qualityScore: 5,
        confidence: 0.1,
      };
    }
  }

  /**
   * Get fallback analysis when AI fails
   */
  private getFallbackAnalysis(contest: RawContest): AIProcessResult {
    const title = contest.title?.toLowerCase() || '';
    const description = contest.description?.toLowerCase() || '';
    const content = `${title} ${description}`;

    // Simple keyword-based classification
    let contestType: string = 'mixed';
    if (
      content.includes('image') ||
      content.includes('vision') ||
      content.includes('图像')
    ) {
      contestType = 'image';
    } else if (content.includes('video') || content.includes('视频')) {
      contestType = 'video';
    } else if (
      content.includes('audio') ||
      content.includes('speech') ||
      content.includes('音频')
    ) {
      contestType = 'audio';
    } else if (
      content.includes('text') ||
      content.includes('nlp') ||
      content.includes('language')
    ) {
      contestType = 'text';
    } else if (
      content.includes('code') ||
      content.includes('programming') ||
      content.includes('代码')
    ) {
      contestType = 'code';
    }

    // Simple difficulty assessment
    let difficulty = 'intermediate';
    if (
      content.includes('beginner') ||
      content.includes('入门') ||
      content.includes('初级')
    ) {
      difficulty = 'beginner';
    } else if (
      content.includes('advanced') ||
      content.includes('expert') ||
      content.includes('高级')
    ) {
      difficulty = 'advanced';
    }

    // Extract basic tags
    const tags: string[] = [];
    const tagKeywords = [
      'machine-learning',
      'ai',
      'deep-learning',
      'computer-vision',
      'nlp',
      'pytorch',
      'tensorflow',
      'huggingface',
      'llm',
    ];

    tagKeywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    });

    // Basic AI tools suggestion
    const aiTools = ['Python', 'Jupyter', 'PyTorch', 'TensorFlow'];

    return {
      contestType,
      difficulty,
      summary:
        `${contest.description?.substring(0, 200)}...` ||
        'Contest details not available',
      tags,
      aiTools,
      qualityScore: 6, // Default medium quality
      confidence: 0.3, // Low confidence for fallback
    };
  }

  /**
   * Map contest type to valid enum value
   */
  private mapContestType(
    type: string
  ): 'image' | 'video' | 'audio' | 'text' | 'code' | 'mixed' {
    const validTypes = ['image', 'video', 'audio', 'text', 'code', 'mixed'];
    return validTypes.includes(type as (typeof validTypes)[number])
      ? (type as 'image' | 'video' | 'audio' | 'text' | 'code' | 'mixed')
      : 'mixed';
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
    return validDifficulties.includes(
      difficulty as (typeof validDifficulties)[number]
    )
      ? (difficulty as 'beginner' | 'intermediate' | 'advanced')
      : 'intermediate';
  }

  /**
   * Extract requirements from description
   */
  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];

    // Look for common requirement patterns
    const requirementPatterns = [
      /requirements?:?\s*(.+)/i,
      /需要:?\s*(.+)/,
      /must have:?\s*(.+)/i,
      /prerequisites?:?\s*(.+)/i,
    ];

    for (const pattern of requirementPatterns) {
      const match = description.match(pattern);
      if (match) {
        // Split by common delimiters
        const reqs = match[1]
          .split(/[,;，；\n]/)
          .map(req => req.trim())
          .filter(req => req.length > 0 && req.length < 100);

        requirements.push(...reqs);
        break; // Only use first match
      }
    }

    return requirements.slice(0, 5); // Limit to 5 requirements
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
      summary: 'Contest analysis unavailable',

      contestType: 'mixed',
      status: this.mapStatus(rawContest.status),
      difficulty: 'intermediate',

      deadline: rawContest.deadline,
      prize: rawContest.prize,

      tags: [],
      aiTools: [],
      requirements: [],

      qualityScore: 3, // Low quality for failed processing
      processedAt: new Date().toISOString(),
      scrapedAt: rawContest.scrapedAt,
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
  }

  /**
   * Add delay between requests
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update rate limit delay
   */
  setRateLimitDelay(delay: number): void {
    this.rateLimitDelay = Math.max(100, delay); // Minimum 100ms
  }

  /**
   * Get processing statistics
   */
  getStats(): Record<string, unknown> {
    return {
      config: {
        apiEndpoint: this.config.apiEndpoint,
        maxTokens: this.config.maxTokens,
        batchSize: this.config.batchSize,
      },
      rateLimitDelay: this.rateLimitDelay,
      lastProcessed: new Date().toISOString(),
    };
  }
  /**
   * Refine tags by splitting compounds, removing generic terms, and sorting
   */
  private refineTags(tags: string[]): string[] {
    // 1. Split compound tags (e.g., "Machine Learning/AI" -> ["Machine Learning", "AI"])
    const splitTags: string[] = [];
    tags.forEach(tag => {
      if (tag.includes('/')) {
        splitTags.push(...tag.split('/').map(t => t.trim()));
      } else {
        splitTags.push(tag);
      }
    });
    
    // 2. Deduplicate (case-insensitive)
    const uniqueTags = Array.from(new Set(splitTags.map(t => t.toLowerCase())))
        .map(lower => splitTags.find(t => t.toLowerCase() === lower) || '')
        .filter(t => t !== '');
    
    // 3. Define generic and specific tags
    const genericTags = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'dl'];
    const specificTags = uniqueTags.filter(t => !genericTags.includes(t.toLowerCase()));
    
    // 4. If we have >= 2 specific tags, remove all generic ones
    const finalTags = specificTags.length >= 2 ? specificTags : uniqueTags;
    
    // 5. Sort: Prioritize domain-specific tags (CV, NLP, LLM, etc.)
    const domainPriority = ['computer vision', 'cv', 'nlp', 'natural language processing', 
                           'llm', 'large language model', 'reinforcement learning', 'rl',
                           'time series', 'recommendation', 'graph', 'audio', 'speech'];
    
    finalTags.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aPriority = domainPriority.some(d => aLower.includes(d));
      const bPriority = domainPriority.some(d => bLower.includes(d));
      
      if (aPriority && !bPriority) return -1;
      if (!aPriority && bPriority) return 1;
      return 0; // Maintain original order for equal priority
    });
    
    return finalTags.slice(0, 8); // Limit to 8 tags
  }
}
