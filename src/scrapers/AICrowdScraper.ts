/**
 * AICrowd platform scraper
 * Scrapes AI/ML competition data from AICrowd.com
 */

import { EnhancedScraper } from './EnhancedScraper';
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

export class AICrowdScraper extends EnhancedScraper {
  constructor(config: PlatformConfig) {
    super(config);
  }

  get platform(): string {
    return 'aicrowd';
  }

  /**
   * Scrape contests from AICrowd platform
   */
  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting scrape for ${this.platform}`, {
      url: this.config.contestListUrl,
    });

    try {
      await this.applyDelay();

      // AICrowd uses dynamic loading, use Puppeteer
      const html = await this.fetchHtmlWithPuppeteer(
        this.config.contestListUrl,
        this.config.selectors.contestItems
      );

      const contests = this.parseAICrowdContests(html);
      const validContests = contests.filter((contest) =>
        this.validateContest(contest)
      );

      // Enrich with detail page data (limit to 10 for now)
      const enrichedContests = await this.enrichContestData(
        validContests.slice(0, 10)
      );

      logger.info(
        `Successfully scraped ${enrichedContests.length} contests from ${this.platform}`
      );

      return enrichedContests;
    } catch (error) {
      logger.error(`Failed to scrape ${this.platform}`, { error });
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Parse contest data from AICrowd HTML
   */
  private parseAICrowdContests(html: string): RawContest[] {
    const $ = cheerio.load(html);
    const contests: RawContest[] = [];

    // Select challenge cards
    $(this.config.selectors.contestItems).each((_index, element) => {
      try {
        const $card = $(element);

        // Extract title and URL from card-title link
        const titleLink = $card
          .find('.card-title a, a.card-img-overlay')
          .first();
        const title =
          titleLink.text().trim() || $card.find('.card-title').text().trim();

        let url = titleLink.attr('href') || '';
        if (url && !url.startsWith('http')) {
          url = `https://www.aicrowd.com${url}`;
        }

        // Clean up title
        // Remove ": Starting soon" or similar prefixes which seem to be concatenated text
        let cleanTitle = title;
        cleanTitle = cleanTitle.replace(/^:\s*Starting soon\s*/i, '');
        cleanTitle = cleanTitle.replace(/^:\s*/, ''); // Remove leading colons
        cleanTitle = cleanTitle.replace(/Track \d+:/i, ''); // Optional: remove "Track X:"

        // Extract deadline/status from badge
        const statusBadge = $card
          .find('.badge, .card-img-overlay span')
          .first();
        const statusText = statusBadge.text().trim();

        // Extract description
        const description = $card.find('.card-text, .card-intro').text().trim();

        // Extract prize from card body text
        const cardBodyText = $card.find('.card-body').text();
        const prizeMatch = cardBodyText.match(
          /(\$[\d,]+|USD\s*[\d,]+|[\d,]+\s*USD)/i
        );
        const prize = prizeMatch ? prizeMatch[0] : 'TBD';

        // Extract image
        const imageUrl = $card.find('img').attr('src') || '';

        // Parse status
        let status: 'active' | 'upcoming' | 'ended' = 'active';
        if (
          statusText.toLowerCase().includes('completed') ||
          statusText.toLowerCase().includes('ended')
        ) {
          status = 'ended';
        } else if (
          statusText.toLowerCase().includes('coming') ||
          statusText.toLowerCase().includes('starting') ||
          statusText.toLowerCase().includes('soon')
        ) {
          status = 'upcoming';
        }

        // Parse deadline from "X days left" format
        let deadline: string | undefined;
        const daysMatch = statusText.match(/(\d+)\s*days?\s*left/i);
        if (daysMatch) {
          const daysLeft = parseInt(daysMatch[1], 10);
          const deadlineDate = new Date();
          deadlineDate.setDate(deadlineDate.getDate() + daysLeft);
          deadline = deadlineDate.toISOString();
        } else if (status === 'upcoming') {
          // For upcoming contests without specific date, leave deadline undefined
          // UI should handle this as "TBA"
        }

        if (cleanTitle && url) {
          contests.push({
            title: cleanTitle.trim(),
            url,
            platform: this.platform,
            imageUrl, // Extracted from list card
            description: description || undefined,
            deadline,
            prize,
            status,
            scrapedAt: new Date().toISOString(),
            metadata: {
              statusText,
              imageUrl,
              cardBodyText: cardBodyText.substring(0, 200),
            },
          });
        }
      } catch (error) {
        logger.warn('Failed to parse AICrowd contest card', { error });
      }
    });

    logger.info(`Parsed ${contests.length} contests from AICrowd`);
    return contests;
  }

  /**
   * Enrich contest data with detail page information in parallel chunks
   */
  private async enrichContestData(
    contests: RawContest[]
  ): Promise<RawContest[]> {
    const enrichedContests: RawContest[] = [];
    const CONCURRENCY_LIMIT = 3;

    // Process in chunks
    for (let i = 0; i < contests.length; i += CONCURRENCY_LIMIT) {
      const chunk = contests.slice(i, i + CONCURRENCY_LIMIT);

      const chunkResults = await Promise.all(
        chunk.map(async (contest) => {
          if (!contest.url) return contest;

          try {
            await this.applyDelay(); // Minor delay to stagger starts

            // Note: Parallel puppeteer tabs might be heavy.
            // Ensure configureBrowser matches this usage or rely on single-page reuse logic.
            // EnhancedScraper uses a single singleton page usually?
            // If fetchHtmlWithPuppeteer uses `this.browser.newPage()`, it's fine.
            // Let's assume fetchHtmlWithPuppeteer handles page creation/closing.

            // Use a shorter wait timeout if possible, or catch specific timeout errors quickly.
            // Since we can't easily change the timeout passed to fetchHtmlWithPuppeteer from here without changing the base class,
            // we rely on parallelism to speed up total time.

            const detailHtml = await this.fetchHtmlWithPuppeteer(
              contest.url,
              '.challenge-description, .challenge-timeline, h1'
            );
            const $ = cheerio.load(detailHtml);

            // 1. Better Title Extraction (Detail Page often has the real H1)
            // Use strict text extraction to avoid concatenated child text
            let detailTitle = $('h1')
              .first()
              .contents()
              .filter((_, el) => el.type === 'text')
              .text()
              .trim();

            // Fallback: if text node extraction failed, try standard text() but clean known suffixes
            if (!detailTitle) {
              detailTitle = $('h1').first().text().trim();
            }

            if (
              detailTitle &&
              !detailTitle.toLowerCase().includes('round') &&
              !detailTitle.toLowerCase().includes('phase') &&
              detailTitle.length > 5
            ) {
              // Heuristic: If title is super long, it might still have junk.
              // AICrowd titles are usually < 100 chars.
              if (detailTitle.length < 150) {
                contest.title = detailTitle;
              }
            }

            // 2. Full Description Extraction
            // AICrowd often uses these classes for the main content
            let fullDescription = $(
              '.challenge-description, .prose, .markdown-body, article'
            )
              .first()
              .text()
              // Replace multiple newlines/spaces
              .replace(/\s+/g, ' ')
              .trim();

            // Clean Description: Remove Title repeat at start
            if (contest.title && fullDescription.startsWith(contest.title)) {
              fullDescription = fullDescription
                .substring(contest.title.length)
                .trim();
            }
            // Remove common duplicate subtitles often found in AICrowd intro
            // e.g. "Global Chess Challenge 2025 Train LLMs..." -> "Train LLMs..."
            // We can try to split by newline if we preserved them, but since we flattened, use simple heuristic?
            // Actually, let's capture description WITH newlines preserved for better formatting
            const descriptionWithNewlines = $(
              '.challenge-description, .prose, .markdown-body, article'
            )
              .first()
              .text()
              .trim();

            if (
              descriptionWithNewlines &&
              descriptionWithNewlines.length >
                (contest.description?.length || 0)
            ) {
              let cleanDesc = descriptionWithNewlines;
              // aggressive start cleanup
              if (contest.title && cleanDesc.startsWith(contest.title)) {
                cleanDesc = cleanDesc.substring(contest.title.length).trim();
              }
              contest.description = cleanDesc;
            }

            // Extract high-res image from meta tags (og:image)
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) {
              contest.imageUrl = ogImage;
            }

            // Try to get organizer info
            const organizer = $('[class*="organizer"], [class*="host"]')
              .first()
              .text()
              .trim();
            if (organizer) {
              contest.metadata.organizer = organizer;
            }

            // 3. Smart Tag Extraction & Filtering
            const tags: string[] = [];
            $('.badge, .tag, [class*="badge"], [class*="label"]').each(
              (_i, el) => {
                const tagText = $(el).text().trim();
                if (tagText && tagText.length < 40) {
                  // Filter out junk
                  const lower = tagText.toLowerCase();
                  if (
                    lower.includes('round') ||
                    lower.includes('days left') ||
                    lower.includes('completed') ||
                    lower.includes('starting soon') ||
                    lower.match(/^\d{4}$/) // Remove just "2025" or similar
                  ) {
                    return;
                  }
                  if (!tags.includes(tagText)) tags.push(tagText);
                }
              }
            );
            if (tags.length > 0) {
              contest.metadata.tags = tags.slice(0, 10);
            }

            logger.debug(`Enriched contest: ${contest.title}`);
            return contest;
          } catch (error) {
            logger.warn(`Failed to enrich contest: ${contest.title}`, {
              error,
            });
            return contest;
          }
        })
      );

      enrichedContests.push(...chunkResults);
    }

    return enrichedContests;
  }
}
