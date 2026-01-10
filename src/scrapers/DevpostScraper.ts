import { EnhancedScraper } from './EnhancedScraper';
import { RawContest } from '../types';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

export class DevpostScraper extends EnhancedScraper {
  get platform(): string {
    return 'devpost';
  }

  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting scrape for ${this.platform}`, {
      url: this.config.contestListUrl,
    });

    try {
      // Devpost uses client-side rendering for the hackathon list.
      // Using Puppeteer to fetch rendered HTML, waiting for the contest items to appear.
      const html = await this.fetchHtmlWithPuppeteer(
        this.config.contestListUrl,
        this.config.selectors.contestItems
      );

      const contests = this.extractContestDataList(html);

      logger.info(`Parsed ${contests.length} contests from Devpost HTML`);

      // Enrich details in parallel chunks
      const enrichedContests: RawContest[] = [];

      // Limit to 10 for now
      const toProcess = contests.slice(0, 10);
      const CONCURRENCY_LIMIT = 5; // Devpost handles standard HTTP well

      for (let i = 0; i < toProcess.length; i += CONCURRENCY_LIMIT) {
        const chunk = toProcess.slice(i, i + CONCURRENCY_LIMIT);

        const chunkResults = await Promise.all(
          chunk.map(async (contest) => {
            try {
              if (!contest.url) return contest;

              await this.applyDelay();
              // Use a shorter timeout for enrichment to fail fast logic inside fetchHtml if supported?
              // fetchHtml has default timeout.

              const detailHtml = await this.fetchHtml(contest.url);
              this.enrichContestDetails(contest, detailHtml);

              if (this.validateContest(contest)) {
                return contest;
              }
              return null;
            } catch (e: unknown) {
              // If failed, just return the basic contest if valid
              const errorMessage = e instanceof Error ? e.message : String(e);
              logger.warn(`Failed to enrich Devpost contest ${contest.title}`, {
                error: errorMessage,
              });
              return this.validateContest(contest) ? contest : null;
            }
          })
        );

        // Filter out nulls
        chunkResults.forEach((r) => {
          if (r) enrichedContests.push(r);
        });
      }

      return enrichedContests;
    } catch (error) {
      logger.error(`Failed to scrape ${this.platform}`, { error });
      throw error;
    }
  }

  private extractContestDataList(html: string): RawContest[] {
    const $ = cheerio.load(html);
    const contests: RawContest[] = [];

    // Devpost hackathon tiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $('.hackathon-tile').each((_: number, el: any) => {
      const $el = $(el);

      const title = $el.find('.main-content h3').text().trim();
      const url =
        $el.find('a.tile-anchor').attr('href') ||
        $el.find('a').attr('href') ||
        '';
      const statusText = $el.find('.status-label').text().trim();
      const timeLeft = $el.find('.time-left').text().trim();
      const submissionCount = $el.find('.participants strong').text().trim();
      const prize = $el.find('.prize-amount').text().trim(); // Note: Often empty on list view if "Multiple Prizes"
      const thumbnail =
        $el.find('.side-feature img').attr('src') ||
        $el.find('.hackathon-thumbnail').attr('src');

      // Themes/Tags
      const themes: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $el.find('.theme-label').each((_: number, t: any) => {
        themes.push($(t).text().trim());
      });

      if (title && url) {
        // Calculate rough deadline from time left if possible, or leave undefined for AI enrichment

        contests.push({
          platform: this.platform,
          title,
          url,
          imageUrl: thumbnail || '', // Initial image from list view
          description: '', // Will get from details
          prize: prize || 'See Details',
          rawHtml: $el.html() || '',
          scrapedAt: new Date().toISOString(),
          metadata: {
            status: statusText,
            timeLeft,
            submissionCount,
            thumbnail,
            themes,
          },
        });
      }
    });

    return contests;
  }

  private enrichContestDetails(contest: RawContest, html: string) {
    const $ = cheerio.load(html);

    // Description
    // Description - Try multiple selectors as Devpost templates vary
    let desc = '';
    const selectors = [
      '#challenge-overview', // Standard
      '#challenge-description', // Variation
      '.challenge-body', // Variation
      '#main-content .description', // Generic
      '.hyphenate', // Fallback (often catches the intro text)
      'div[class*="description"]', // Loose match
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 50) {
        // arbitrary threshold to avoid empty junk
        desc = text;
        break;
      }
    }

    if (desc) contest.description = this.cleanText(desc);

    // Extract high-res image from meta tags (og:image)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      contest.imageUrl = ogImage;
    }

    // Try JSON-LD first (Most reliable for Deadline & Tags)
    try {
      const rawJson = $('script[type="application/ld+json"]').html();
      if (rawJson) {
        const data = JSON.parse(rawJson);
        // Schema.org/Event
        if (data.endDate) {
          contest.deadline = new Date(data.endDate).toISOString();
        }
        if (data.keywords) {
          // Keywords can be comma-separated string or array
          const keywords = Array.isArray(data.keywords)
            ? data.keywords
            : typeof data.keywords === 'string'
              ? data.keywords.split(',')
              : [];
          const cleanTags = keywords
            .map((k: string) => k.trim())
            .filter((k: string) => k.length > 0);
          if (cleanTags.length > 0) {
            contest.metadata = { ...contest.metadata, tags: cleanTags };
          }
        }
        if (data.organizer && data.organizer.name) {
          contest.metadata = {
            ...contest.metadata,
            organizer: data.organizer.name,
          };
        }
      }
    } catch (e) {
      logger.warn('Failed to parse Devpost JSON-LD', { error: e });
    }

    // DOM Fallback for Tags (if JSON-LD metadata didn't set it)
    if (!contest.metadata?.tags) {
      const tags: string[] = [];
      $('#built-with li').each((_: number, el) => {
        tags.push($(el).text().trim());
      });
      // Also try theme tags if not present
      if (tags.length === 0) {
        $('.theme-label').each((_: number, el) => {
          tags.push($(el).text().trim());
        });
      }
      if (tags.length > 0) contest.metadata = { ...contest.metadata, tags };
    }
  }
}
