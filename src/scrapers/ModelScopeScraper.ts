/**
 * ModelScope platform scraper
 * Scrapes AI competition data from ModelScope.cn
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import * as puppeteer from 'puppeteer';
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
    logger.info(`Starting scrape for ${this.platform}`, {
      url: this.config.contestListUrl,
    });

    try {
      await this.applyDelay();

      // Use Puppeteer for SPA content - ModelScope requires dynamic loading
      let html: string;
      try {
        // Use Puppeteer to handle carousel navigation and collect slide links
        const navResult = await this.fetchHtmlWithCarouselNavigation(
          this.config.contestListUrl
        );
        html = navResult.html;
        // attach slide links to config for later enrichment
        (this as any)._carouselSlideLinks = navResult.links || [];
        logger.info(
          'Successfully fetched HTML with carousel navigation for ModelScope',
          { slideLinks: (this as any)._carouselSlideLinks.length }
        );
      } catch (puppeteerError) {
        logger.warn(
          'Puppeteer carousel navigation failed, falling back to simple Puppeteer',
          { error: puppeteerError }
        );
        try {
          html = await this.fetchHtmlWithPuppeteer(this.config.contestListUrl);
          logger.info(
            'Successfully fetched HTML with Puppeteer for ModelScope'
          );
        } catch (fallbackError) {
          logger.warn('Puppeteer failed, falling back to simple HTTP', {
            error: fallbackError,
          });
          html = await this.fetchHtml(this.config.contestListUrl);
        }
      }

      const contests = this.parseContests(html);
      // If carousel provided explicit slide links, fetch their detail pages and merge
      try {
        const slideLinks: string[] = (this as any)._carouselSlideLinks || [];
        for (const link of slideLinks) {
          try {
            // Normalize
            const normalized = this.isValidUrl(link)
              ? link
              : `${this.config.baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
            // Skip if already present
            if (contests.find(c => c.url === normalized)) continue;
            await this.applyDelay();
            const detailHtml = await this.fetchHtml(normalized);
            const minimal: RawContest = {
              platform: this.platform,
              title: '',
              description: '',
              url: normalized,
              deadline: undefined,
              prize: '',
              rawHtml: '',
              scrapedAt: new Date().toISOString(),
              metadata: {},
            };
            const enriched = await this.extractDetailedInfo(
              minimal,
              detailHtml
            );
            // Only add if validated
            if (this.validateContest(enriched)) {
              contests.push(enriched);
            } else {
              // still push minimally so it's not lost
              contests.push(enriched);
            }
          } catch (e) {
            logger.warn('Failed to fetch/parse slide link', { link, error: e });
          }
        }
      } catch (e) {
        // ignore carousel enrichment errors
        logger.warn('Carousel enrichment failed', { error: e });
      }
      const validContests = contests.filter(contest =>
        this.validateContest(contest)
      );
      const enrichedContests = await this.enrichContestData(validContests);

      logger.info(
        `Successfully scraped ${enrichedContests.length} contests from ${this.platform}`
      );

      return enrichedContests;
    } catch (error) {
      logger.error(`Failed to scrape ${this.platform}`, {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        url: this.config.contestListUrl,
      });
      throw error;
    } finally {
      await this.closeBrowser();
    }
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
      'div[class*="acss-ukjaiy"]', // Competition card containers
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
    let browser = null;
    let page = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      });

      page = await browser.newPage();

      // Set user agent to avoid detection
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for carousel to load
      await page.waitForSelector('.slick-slider', { timeout: 10000 });

      logger.info('Carousel loaded, starting navigation');

      // Get all carousel dot buttons
      // Prefer iterating slides directly (exclude cloned slides) to collect anchors
      const slides = await page.$$('.slick-slide:not(.slick-cloned)');
      logger.info(`Found ${slides.length} carousel slides`);

      const allHtmlContent: string[] = [];
      const collectedLinks = new Set<string>();

      // Iterate slides: activate each slide (via dot or click) then collect anchors within the active slide
      for (let i = 0; i < Math.max(slides.length, 1); i++) {
        try {
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
          await page.waitForTimeout(800);

          // Collect anchors within the active slide
          const linksInSlide: string[] = await page.evaluate(() => {
            const out: string[] = [];
            try {
              const doc: any = (globalThis as any).document;
              if (!doc) return out;
              const active: any = doc.querySelector(
                '.slick-slide.slick-active'
              );
              if (active) {
                const anchors: any = active.querySelectorAll('a[href]');
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

          linksInSlide.forEach(l => {
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
      if (browser) await browser.close().catch(() => {});
    }
  }
}
