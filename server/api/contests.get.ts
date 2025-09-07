import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { H3Event } from 'h3';

interface Contest {
  id: string;
  title: string;
  platform: string;
  status?: string;
  description?: string;
  summary?: string;
  startDate?: string;
  endDate?: string;
  prize?: string;
  tags?: string[];
  url?: string;
  originalUrl?: string;
  qualityScore?: number;
  lastUpdated?: string;
  processedAt?: string;
}

export default defineEventHandler(async _event => {
  try {
    // Read contest data from the processed JSON file
    const dataPath = join(
      process.cwd(),
      'data',
      'processed',
      'all-contests-latest.json'
    );

    if (!existsSync(dataPath)) {
      throw new Error('Contest data file not found');
    }

    const fileContent = readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Transform and format contest data
    const contests = data.contests.slice(0, 50).map((contest: Contest) => ({
      id: contest.id,
      title: contest.title,
      platform: contest.platform,
      status: contest.status || 'active',
      description:
        contest.description || contest.summary || 'No description available',
      startDate: contest.startDate,
      endDate: contest.endDate,
      prize: contest.prize || 'TBD',
      tags: contest.tags || [],
      url: contest.url || contest.originalUrl || '#',
      quality: Math.round(((contest.qualityScore || 7) / 10) * 10) / 10, // Convert to 0-10 scale
      lastUpdated: contest.lastUpdated || contest.processedAt,
    }));

    return {
      success: true,
      data: contests,
      total: contests.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error loading contests:', error);

    // Return fallback data if file reading fails
    const fallbackContests = [
      {
        id: 'fallback-1',
        title: 'ModelScope AI Challenge',
        platform: 'ModelScope',
        status: 'active',
        description:
          'Comprehensive AI competition featuring computer vision and NLP tasks',
        prize: '$50,000',
        tags: ['computer-vision', 'nlp', 'machine-learning'],
        url: 'https://modelscope.cn',
        quality: 8.5,
      },
      {
        id: 'fallback-2',
        title: 'Civitai Creative Contest',
        platform: 'Civitai',
        status: 'active',
        description:
          'AI art generation competition using Stable Diffusion models',
        prize: '$10,000',
        tags: ['ai-art', 'stable-diffusion', 'creativity'],
        url: 'https://civitai.com',
        quality: 7.8,
      },
      {
        id: 'fallback-3',
        title: 'DrivenData Social Impact Challenge',
        platform: 'DrivenData',
        status: 'upcoming',
        description:
          'Data science competition focused on social good and environmental issues',
        prize: '$25,000',
        tags: ['data-science', 'social-impact', 'environment'],
        url: 'https://drivendata.org',
        quality: 9.2,
      },
    ];

    return {
      success: true,
      data: fallbackContests,
      total: fallbackContests.length,
      timestamp: new Date().toISOString(),
      note: 'Using fallback data due to data file access error',
    };
  }
});

function defineEventHandler(handler: (event: H3Event) => Promise<unknown>) {
  return handler;
}
