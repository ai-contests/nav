/**
 * ModelScope platform scraper
 * Scrapes AI competition data from ModelScope.cn
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import axios from 'axios';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';
import { EnhancedScraper } from './EnhancedScraper';

export class ModelScopeScraper extends EnhancedScraper {
  constructor(config: PlatformConfig) {
    super(config);
  }

  get platform(): string {
    return 'modelscope';
  }

  /**
   * Scrape contests from ModelScope platform
   */
  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting scrape for ${this.platform} via API`, {
      url: 'https://modelscope.cn/api/v1/competitions',
    });

    try {
      // Direct API call
      const response = await axios.get(
        'https://modelscope.cn/api/v1/competitions',
        {
          headers: {
            'User-Agent': this.userAgent,
            Referer: 'https://modelscope.cn/',
            Accept: 'application/json, text/plain, */*',
          },
          timeout: 30000,
        }
      );

      if (!response.data || !response.data.Data || !response.data.Data.Races) {
        logger.warn('ModelScope API returned unexpected structure', {
          data: response.data,
        });
        return [];
      }

      const races = response.data.Data.Races;
      logger.info(`Fetched ${races.length} races from ModelScope API`);

      const contests: RawContest[] = races.map((race: any) =>
        this.mapRaceToContest(race)
      );

      const validContests = contests.filter((contest) =>
        this.validateContest(contest)
      );

      // Enrich with detailed info if valid (ModelScope list data is already quite rich, but we pass through)
      const enrichedContests = await this.enrichContestData(validContests);

      logger.info(
        `Successfully scraped ${enrichedContests.length} contests from ${this.platform}`
      );

      return enrichedContests;
    } catch (error) {
      logger.error(`Failed to scrape ${this.platform}`, {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    }
  }

  /**
   * Map API race object to RawContest
   */
  private mapRaceToContest(race: any): RawContest {
    // Construct URL: https://modelscope.cn/competition/{CompetitionId}
    // Some responses use 'Id' instead of 'CompetitionId'
    const id = race.CompetitionId || race.Id;
    const url = `https://modelscope.cn/competition/${id}`;

    // Parse deadline: RegistrationDeadline is unix timestamp in seconds
    let deadline: string | undefined;
    if (race.RegistrationDeadline) {
      deadline = new Date(race.RegistrationDeadline * 1000).toISOString();
    }

    // Try to extract image from Content if ImageUrl is missing
    let imageUrl = race.ImageUrl || race.Icon;
    if (!imageUrl && race.Content) {
      try {
        const contentStr =
          typeof race.Content === 'string'
            ? race.Content
            : JSON.stringify(race.Content);
        // Simple regex to find the first image src in the JSON string
        // Looking for "src":"https://..."
        const imgMatch = contentStr.match(/"src"\s*:\s*"([^"]+)"/);
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }
      } catch (e) {
        // ignore parsing error
      }
    }

    // Map status
    let status: 'active' | 'upcoming' | 'ended' | 'cancelled' = 'active';
    if (race.Status === 1) {
      status = 'active';
    } else if (race.Status === 2) {
      status = 'ended'; // Assumption, verified later or by deadline
    }

    // Double check with deadline
    if (deadline && new Date(deadline) < new Date()) {
      status = 'ended';
    }

    // Extract rich description from Content
    let fullDescription = this.cleanText(race.Brief || '');
    if (race.Content) {
      const contentText = this.parseContentText(
        typeof race.Content === 'string'
          ? race.Content
          : JSON.stringify(race.Content)
      );
      if (contentText.length > fullDescription.length) {
        fullDescription = `${fullDescription}\n\n${contentText}`;
      }
    }

    // Extract Organizer info
    let organizerName = '';
    if (
      race.OrganizerInfo &&
      Array.isArray(race.OrganizerInfo) &&
      race.OrganizerInfo.length > 0
    ) {
      organizerName = race.OrganizerInfo.map((o: any) => o.Name).join(', ');
    }

    return {
      platform: this.platform,
      title: this.cleanText(race.Title || race.CompetitionName || ''),
      description: fullDescription.substring(0, 5000), // Limit length but keep enough for AI
      url,
      deadline,
      status, // Populate top-level status
      prize: this.cleanText(race.BonusDesc || ''),
      rawHtml: '', // No raw HTML from API
      scrapedAt: new Date().toISOString(),
      metadata: {
        rawRace: race,
        difficulty: race.TaskType,
        tags: race.CategoryCn ? [race.CategoryCn] : [],
        status: race.Status, // Keep original status in metadata
        imageUrl,
        organizer: organizerName,
      },
    };
  }

  /**
   * Parse Content JSON string to extract pure text
   */
  private parseContentText(contentStr: string): string {
    try {
      const content = JSON.parse(contentStr);
      if (!Array.isArray(content)) return '';

      let text = '';
      for (const section of content) {
        if (section.content) {
          text += `${this.extractTextFromNode(section.content)}\n`;
        }
      }
      return text.trim();
    } catch (e) {
      return '';
    }
  }

  /**
   * Recursively extract text from Content node structure
   * Node format: [tag, attrs, child1, child2...] or string
   */
  private extractTextFromNode(node: any): string {
    if (typeof node === 'string') return node;
    if (!Array.isArray(node)) return '';

    // node is [tag, attrs, child1, child2...]
    // children start at index 2
    let text = '';
    for (let i = 2; i < node.length; i++) {
      text += this.extractTextFromNode(node[i]);
    }
    return text;
  }

  /**
   * Custom parseContests for ModelScope - handles SPA structure
   */
  protected parseContests(html: string): RawContest[] {
    const $ = cheerio.load(html);
    const contests: RawContest[] = [];

    logger.info('Parsing ModelScope contests with custom logic');

    // ModelScope uses dynamic class names, try multiple selectors
    const possibleSelectors = [
      'div.antd5-col a[href*="/competition/"]', // Column containers with competition links
      'a[href*="/competition/"]', // All competition links
      '.antd5-col', // Grid columns that might contain competitions
      this.config.selectors.contestItems, // Fallback to config
    ];

    let foundContests = false;

    for (const selector of possibleSelectors) {
      logger.info(`Trying selector: ${selector}`);
      const elements = $(selector);
      logger.info(
        `Found ${elements.length} elements with selector: ${selector}`
      );

      if (elements.length > 0) {
        elements.each((index: number, element: any) => {
          try {
            const $element = $(element);

            // Skip if this doesn't look like a contest
            const text = $element.text().toLowerCase();
            if (
              !text.includes('竞赛') &&
              !text.includes('比赛') &&
              !text.includes('挑战') &&
              !text.includes('competition')
            ) {
              return;
            }

            const contest = this.extractContestData($element, $);

            // Validate basic contest data
            if (contest.title && contest.title.trim().length > 3) {
              contests.push(contest);
              logger.info(`Extracted contest: ${contest.title}`);
            }
          } catch (error) {
            logger.warn(`Failed to extract contest ${index}`, { error });
          }
        });

        if (contests.length > 0) {
          foundContests = true;
          logger.info(
            `Successfully found ${contests.length} contests with selector: ${selector}`
          );
          break; // Stop trying other selectors if we found contests
        }
      }
    }

    if (!foundContests) {
      logger.warn('No contests found with any selector, saving debug info');
      // Save HTML for debugging
      try {
        fs.writeFileSync('debug-modelscope-no-contests.html', html);
        logger.info('Saved debug HTML to debug-modelscope-no-contests.html');
      } catch (e) {
        // ignore
      }
    }

    logger.info(`Total contests parsed: ${contests.length}`);
    return contests;
  }

  /**
   * Extract contest data from ModelScope specific HTML structure
   * Updated based on real website structure analysis
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractContestData($element: any, $: any): RawContest {
    const title = this.extractTextFlexible($element, [
      '.acss-1m97cav.acss-dwyc50.acss-igsxg0', // Real title selector from debug
      this.config.selectors.title,
      '.acss-1m97cav',
      '.acss-1wv93nj',
      '.acss-1d7mkp3',
      'h3, h4, .title',
    ]);

    const description = this.extractTextFlexible($element, [
      '.acss-1m97cav.acss-1iac2ic.acss-1dboag6', // Real description selector from debug
      this.config.selectors.description,
      '.acss-1puit0p',
      '.acss-1d7mkp3 + p',
      '.description, p',
    ]);

    const deadline = this.extractTextFlexible($element, [
      this.config.selectors.deadline,
      '.acss-1puit0p',
      '.deadline, .date',
    ]);

    // Fallback: if selector-based extraction failed, try several strategies to find a date
    let deadlineText = deadline;
    if (
      !deadlineText ||
      String(deadlineText).trim().length === 0 ||
      !this.parseModelScopeDate(String(deadlineText))
    ) {
      try {
        const fullText = $element.text();

        // 1) Try ISO-like in full text: 2025-09-21 14:59
        const isoMatch = fullText.match(
          /(\d{4}-\d{1,2}-\d{1,2}\s*\d{1,2}:\d{2})/
        );
        if (isoMatch) deadlineText = isoMatch[1];

        // 2) Try Chinese date in full text: 2025年9月21日 或 带时间
        if (!deadlineText) {
          const chineseMatch = fullText.match(
            /(\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?)/
          );
          if (chineseMatch) deadlineText = chineseMatch[1];
        }

        // 3) Try matching inside element HTML
        if (!deadlineText) {
          const html = $element.html() || '';
          const htmlIso = html.match(/(\d{4}-\d{1,2}-\d{1,2}\s*\d{1,2}:\d{2})/);
          if (htmlIso) deadlineText = htmlIso[1];
          if (!deadlineText) {
            const htmlChinese = html.match(
              /(\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?)/
            );
            if (htmlChinese) deadlineText = htmlChinese[1];
          }
        }

        // 4) Look for nearby label "报名截止" and take sibling/previous text
        if (!deadlineText) {
          $element.find('*').each((_: number, el: any) => {
            if (deadlineText) return;
            try {
              const nodeText = $(el).text() || '';
              if (/报名截止/.test(nodeText)) {
                const prev = $(el).prev();
                if (prev && prev.length > 0) {
                  const t = prev.text().trim();
                  const iso = t.match(
                    /(\d{4}-\d{1,2}-\d{1,2}\s*\d{1,2}:\d{2})/
                  );
                  if (iso) {
                    deadlineText = iso[1];
                    return;
                  }
                  const chinese = t.match(
                    /(\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?)/
                  );
                  if (chinese) {
                    deadlineText = chinese[1];
                    return;
                  }
                }

                const parent = $(el).parent();
                if (parent && parent.length > 0) {
                  parent.children().each((_: number, sib: any) => {
                    if (deadlineText) return;
                    const t2 = $(sib).text().trim();
                    const iso2 = t2.match(
                      /(\d{4}-\d{1,2}-\d{1,2}\s*\d{1,2}:\d{2})/
                    );
                    if (iso2) {
                      deadlineText = iso2[1];
                      return;
                    }
                    const ch2 = t2.match(
                      /(\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?)/
                    );
                    if (ch2) {
                      deadlineText = ch2[1];
                      return;
                    }
                  });
                }
              }
            } catch (e) {
              // ignore per-node errors
            }
          });
        }

        // 5) Final fallback: scan descendant text nodes for any date-like string
        if (!deadlineText) {
          $element.find('*').each((_: number, el: any) => {
            if (deadlineText) return;
            try {
              const t = $(el).text() || '';
              const iso = t.match(/(\d{4}-\d{1,2}-\d{1,2}\s*\d{1,2}:\d{2})/);
              if (iso) {
                deadlineText = iso[1];
                return;
              }
              const chinese = t.match(
                /(\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?)/
              );
              if (chinese) {
                deadlineText = chinese[1];
                return;
              }
            } catch (e) {
              // ignore per-node errors
            }
          });
        }
      } catch (e) {
        // ignore fallback errors
      }
    }

    const prize = this.extractTextFlexible($element, [
      this.config.selectors.prize,
      '.prize, .reward',
    ]);

    // Extract URL: prefer ancestor <a> or child <a>
    let url = '';
    try {
      if ($element.is('a')) {
        url = $element.attr('href') || '';
      } else {
        const ancestorLink = $element.closest('a');
        if (ancestorLink && ancestorLink.length > 0) {
          url = ancestorLink.attr('href') || '';
        }

        if (!url) {
          const childLink = $element.find('a[href]').first();
          if (childLink && childLink.length > 0) {
            url = childLink.attr('href') || '';
          }
        }
      }

      // Normalize relative URLs
      if (url && !url.startsWith('http')) {
        if (url.startsWith('/')) {
          url = `${this.config.baseUrl}${url}`;
        } else {
          url = `${this.config.baseUrl}/${url}`;
        }
      }
    } catch (e) {
      // leave url empty on error
    }

    // Extract ModelScope specific metadata
    const metadata = this.extractModelScopeMetadata($element, $);
    // Inject debug extraction info to help diagnose missing deadlines when enabled in config
    const debugEnabled = Boolean(
      this.config && (this.config as any).debugExtraction
    );
    if (debugEnabled) {
      metadata.debugExtraction = metadata.debugExtraction || {};
      metadata.debugExtraction.attempts =
        metadata.debugExtraction.attempts || [];
    }

    const contest: RawContest = {
      platform: this.platform,
      title: this.cleanText(title || ''),
      description: this.cleanText(description || ''),
      url,
      // Record which raw deadlineText we attempted to parse and the normalized result
      deadline: this.parseModelScopeDate(deadlineText),
      prize: this.cleanText(prize || ''),
      rawHtml: $element.html() || '',
      scrapedAt: new Date().toISOString(),
      metadata,
    };

    // Push final attempt record if debug enabled
    try {
      if (debugEnabled) {
        metadata.debugExtraction.attempts.push({
          candidate: deadlineText || null,
          parsed: this.parseModelScopeDate(deadlineText) || null,
        });
      }
    } catch (e) {
      // ignore
    }

    return contest;
  }

  /**
   * Extract ModelScope specific metadata
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractModelScopeMetadata(
    $element: any,
    $: any
  ): Record<string, any> {
    const metadata: Record<string, any> = {};

    try {
      // Extract status (active/ended/upcoming)
      const statusElement = $element.find(
        '.status, .contest-status, [class*="status"]'
      );
      if (statusElement.length > 0) {
        metadata.status = this.cleanText(statusElement.text());
      }

      // Extract participant count
      const participantElement = $element.find(
        '.participants, .participant-count, [class*="participant"]'
      );
      if (participantElement.length > 0) {
        const participantText = participantElement.text();
        const participantMatch = participantText.match(/(\d+)/);
        if (participantMatch) {
          metadata.participantCount = parseInt(participantMatch[1], 10);
        }
      }

      // Extract tags/categories
      const tagElements = $element.find(
        '.tag, .category, .label, [class*="tag"]'
      );
      const tags: string[] = [];
      tagElements.each((_: number, tagEl: any) => {
        const tagText = $(tagEl).text().trim();
        if (tagText) {
          tags.push(tagText);
        }
      });
      if (tags.length > 0) {
        metadata.tags = tags;
      }

      // Extract organizer information
      const organizerElement = $element.find(
        '.organizer, .host, [class*="organizer"]'
      );
      if (organizerElement.length > 0) {
        metadata.organizer = this.cleanText(organizerElement.text());
      }

      // Extract difficulty level
      const difficultyElement = $element.find(
        '.difficulty, .level, [class*="difficulty"]'
      );
      if (difficultyElement.length > 0) {
        metadata.difficulty = this.cleanText(difficultyElement.text());
      }
    } catch (error) {
      logger.warn('Failed to extract ModelScope metadata', { error });
    }

    return metadata;
  }

  /**
   * Parse ModelScope date format to ISO string
   */
  private parseModelScopeDate(dateString?: string): string | undefined {
    if (!dateString) return undefined;

    try {
      // Common ModelScope date formats
      const cleanDateString = dateString
        .replace(/截止时间[：:]?|deadline[：:]?/i, '')
        .trim();

      // Handle Chinese date formats like "2024年12月31日"
      const chineseDateMatch = cleanDateString.match(
        /(\d{4})年(\d{1,2})月(\d{1,2})日/
      );
      if (chineseDateMatch) {
        const [, year, month, day] = chineseDateMatch;
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        return date.toISOString();
      }

      // Handle ISO-like formats
      // Handle ISO-like formats and normalize common "YYYY-MM-DD HH:mm" to ISO
      // e.g. "2025-09-21 14:59" -> "2025-09-21T14:59:00"
      const isoLike = cleanDateString.match(
        /^\d{4}-\d{1,2}-\d{1,2}\s*\d{1,2}:\d{2}$/
      );
      if (isoLike) {
        const normalized = `${cleanDateString.replace(/\s+/, 'T')}:00`;
        const dt = new Date(normalized);
        if (!isNaN(dt.getTime())) return dt.toISOString();
      }

      // Try generic Date parse as a last resort
      const date = new Date(cleanDateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      logger.warn('Failed to parse ModelScope date', { dateString, error });
    }

    return undefined;
  }

  /**
   * Enrich contest data with additional details from individual contest pages
   */
  private async enrichContestData(
    contests: RawContest[]
  ): Promise<RawContest[]> {
    const enrichedContests: RawContest[] = [];

    for (const contest of contests) {
      try {
        // Apply rate limiting between requests
        await this.applyDelay();

        if (contest.url && this.isValidUrl(contest.url)) {
          const detailHtml = await this.fetchHtml(contest.url);
          const enrichedContest = await this.extractDetailedInfo(
            contest,
            detailHtml
          );
          enrichedContests.push(enrichedContest);
        } else {
          enrichedContests.push(contest);
        }
      } catch (error) {
        logger.warn(`Failed to enrich contest data for: ${contest.title}`, {
          error,
        });
        enrichedContests.push(contest);
      }
    }

    return enrichedContests;
  }

  /**
   * Extract detailed information from individual contest page
   */
  private async extractDetailedInfo(
    contest: RawContest,
    html: string
  ): Promise<RawContest> {
    try {
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);

      // Extract more detailed description
      const detailedDesc = $(
        '.contest-description, .competition-description, .detail-content'
      ).text();
      if (
        detailedDesc &&
        detailedDesc.length > (contest.description || '').length
      ) {
        contest.description = this.cleanText(detailedDesc);
      }

      // Extract registration deadline separately from submission deadline
      const regDeadline = $('.registration-deadline, .reg-deadline').text();
      if (regDeadline) {
        contest.metadata.registrationDeadline =
          this.parseModelScopeDate(regDeadline);
      }

      // Extract prize details
      const prizeDetails = $(
        '.prize-detail, .award-detail, .reward-info'
      ).text();
      if (prizeDetails && prizeDetails.length > (contest.prize || '').length) {
        contest.prize = this.cleanText(prizeDetails);
      }

      // Extract requirements
      const requirements = $('.requirements, .rules, .contest-rules').text();
      if (requirements) {
        contest.metadata.requirements = this.cleanText(requirements);
      }

      // Extract submission format
      const submissionFormat = $(
        '.submission-format, .format, .submit-format'
      ).text();
      if (submissionFormat) {
        contest.metadata.submissionFormat = this.cleanText(submissionFormat);
      }
    } catch (error) {
      logger.warn('Failed to extract detailed contest information', { error });
    }

    return contest;
  }

  /**
   * Validate ModelScope specific contest data
   */
  protected validateContest(contest: RawContest): boolean {
    // Call parent validation first
    if (!super.validateContest(contest)) {
      return false;
    }

    // ModelScope specific validations
    if (!contest.title || contest.title.length < 5) {
      logger.debug('Contest title too short', { title: contest.title });
      return false;
    }

    // Check if URL is actually a ModelScope URL
    if (contest.url && !contest.url.includes('modelscope.cn')) {
      logger.debug('Contest URL is not from ModelScope', { url: contest.url });
      return false;
    }

    return true;
  }

  /**
   * Fetch HTML with carousel navigation - handles ModelScope's slick carousel
   */
  private async fetchHtmlWithCarouselNavigation(
    url: string
  ): Promise<{ html: string; links: string[] }> {
    // Ensure browser is initialized (using EnhancedScraper logic with Stealth)
    await this.initBrowser();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    let page = null;

    try {
      page = await this.browser.newPage();

      // Set user agent to avoid detection (if not already set globally)
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for carousel to load - be more resilient
      try {
        await page.waitForSelector('.slick-slider', { timeout: 10000 });
        logger.info('Carousel loaded, starting navigation');
      } catch (e) {
        logger.warn(
          'Carousel selector not found, attempting fallback to simple page content'
        );
        return { html: await page.content(), links: [] };
      }

      // Get all carousel dot buttons
      // Prefer iterating slides directly (exclude cloned slides) to collect anchors
      const slides = await page.$$('.slick-slide:not(.slick-cloned)');
      logger.info(`Found ${slides.length} carousel slides`);

      const allHtmlContent: string[] = [];
      const collectedLinks = new Set<string>();

      // Iterate slides: activate each slide (via dot or click) then collect anchors within the active slide
      for (let i = 0; i < Math.max(slides.length, 1); i++) {
        try {
          // Check if page is still open
          if (page.isClosed()) break;

          logger.info(`Navigating to carousel slide ${i + 1}/${slides.length}`);

          // Try to activate using corresponding dot if present
          const dot = await page.$(`.slick-dots li:nth-child(${i + 1}) button`);
          if (dot) {
            await dot.click().catch(() => {});
          } else {
            // fallback: click the slide itself
            const slideHandle = slides[i];
            if (slideHandle) {
              await slideHandle.click().catch(() => {});
            }
          }

          // Wait for carousel transition to complete
          await new Promise((r) => setTimeout(r, 1000));

          // Collect anchors within the active slide
          const linksInSlide: string[] = await page.evaluate(() => {
            const out: string[] = [];
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const doc: any = (globalThis as any).document;
              if (!doc) return out;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const active: any = doc.querySelector(
                '.slick-slide.slick-active'
              );
              if (active) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anchors: any = active.querySelectorAll('a[href]');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                anchors.forEach((a: any) => {
                  const href =
                    (a && a.href) ||
                    (a && a.getAttribute && a.getAttribute('href')) ||
                    '';
                  if (href) out.push(href);
                });
              }
            } catch (e) {
              // ignore
            }
            return out;
          });

          linksInSlide.forEach((l) => {
            if (l && l.includes('/competition/')) collectedLinks.add(l);
          });

          // Get the current page HTML snapshot
          const currentHtml = await page.content();
          allHtmlContent.push(currentHtml);

          logger.info(
            `Collected HTML and ${linksInSlide.length} anchors for carousel slide ${i + 1}`
          );
        } catch (error) {
          logger.warn(`Failed to navigate carousel slide ${i + 1}`, { error });
          // Continue with next slide
        }
      }

      // Combine all HTML content and return collected links
      const combinedHtml = allHtmlContent.join(
        '\n<!-- Carousel Slide Separator -->\n'
      );

      logger.info(
        `Successfully collected HTML from ${allHtmlContent.length} carousel slides and ${collectedLinks.size} slide links`
      );

      return { html: combinedHtml, links: Array.from(collectedLinks) };
    } catch (error) {
      logger.error('Failed to fetch HTML with carousel navigation', { error });
      throw error;
    } finally {
      if (page) await page.close().catch(() => {});
      // Do NOT close browser here, as it's managed by the class
    }
  }
}
