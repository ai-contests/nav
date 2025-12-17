/**
 * Civitai platform scraper
 * Scrapes AI competition/event data from Civitai.com
 */

import { EnhancedScraper } from './EnhancedScraper';
import { RawContest, PlatformConfig } from '../types';
import { logger } from '../utils/logger';

export class CivitaiScraper extends EnhancedScraper {
  constructor(config: PlatformConfig) {
    super(config);
  }

  get platform(): string {
    return 'civitai';
  }

  /**
   * Scrape contests from Civitai platform
   */
  async scrape(): Promise<RawContest[]> {
    logger.info(`Starting scrape for ${this.platform}`, {
      url: this.config.contestListUrl,
    });

    try {
      await this.applyDelay();

      // Try Puppeteer-rendered HTML first (better for SPA)
      let html: string;
      try {
        html = await this.fetchHtmlWithPuppeteer(this.config.contestListUrl);
        logger.info('Fetched HTML with Puppeteer for Civitai');
      } catch (e) {
        logger.warn(
          'Puppeteer fetch failed for Civitai, falling back to HTTP fetch',
          { error: e }
        );
        html = await this.fetchHtml(this.config.contestListUrl);
      }

      let contests = this.parseContests(html).filter(contest =>
        this.validateContest(contest)
      );

      // If parsing produced no usable contests, try announcement API as a robust fallback
      if (!contests || contests.length === 0) {
        logger.info(
          'No contests parsed from DOM, attempting to fetch announcement API as fallback'
        );
        try {
          const apiContests = await this.fetchCivitaiAnnouncements();
          if (apiContests && apiContests.length > 0) {
            contests = apiContests.filter(c => this.validateContest(c));
            logger.info(
              `Converted ${apiContests.length} announcement items into contests`
            );
          }
        } catch (e) {
          logger.warn('Failed to fetch/parse announcement API', { error: e });
        }
      }

      // If no contests, return early to avoid unnecessary work
      if (!contests || contests.length === 0) {
        logger.info(`No validated contests found for ${this.platform}`);
        return [];
      }

      const enrichedContests = await this.enrichContestData(contests);

      logger.info(
        `Successfully scraped ${enrichedContests.length} contests from ${this.platform}`
      );
      return enrichedContests;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to scrape ${this.platform}`, {
          message: error.message,
          stack: error.stack,
        });
      } else {
        logger.error(`Failed to scrape ${this.platform}`, { error });
      }
      throw error;
    } finally {
      // Ensure Puppeteer browser is closed so the process can exit cleanly
      try {
        // closeBrowser is defined on EnhancedScraper
        if (typeof this.closeBrowser === 'function')
          await (this as { closeBrowser: () => Promise<void> }).closeBrowser();
      } catch (e) {
        logger.warn('Failed to close browser in scrape finally block', {
          error: e,
        });
      }
    }
  }

  /**
   * Fetch announcement.getAnnouncements payload and convert to RawContest[]
   */
  private async fetchCivitaiAnnouncements(): Promise<RawContest[]> {
    try {
      const axios = await import('axios');
      const { HttpsProxyAgent } = await import('https-proxy-agent');

      // Check for proxy in environment
      const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

      const input = encodeURIComponent(
        JSON.stringify({ json: { domain: 'blue' } })
      );
      const url = `${this.config.baseUrl.replace(/\/$/, '')}/api/trpc/announcement.getAnnouncements?input=${input}`;

      const resp = await axios.default.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://civitai.com/',
          Origin: 'https://civitai.com',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        httpsAgent, // Apply proxy agent if available
        timeout: 15000,
      });

      // The TRPC response wraps the actual data; try to dig into common shapes
      const body = resp.data;
      const items: unknown[] = [];

      // If it's an array, assume it's announcements
      if (Array.isArray(body)) {
        items.push(...body);
      } else if (body && body.result && body.result.data) {
        // trpc v10-ish shape: result.data may hold an object like { json: [...] }
        const d = body.result.data;
        if (Array.isArray(d)) {
          items.push(...d);
        } else if (d && Array.isArray(d.json)) {
          items.push(...d.json);
        } else if (d && d.items) {
          items.push(...d.items);
        }
      } else if (body && body[0] && body[0].result && body[0].result.data) {
        // some trpc replies come as array of calls
        const d = body[0].result.data;
        if (Array.isArray(d)) items.push(...d);
        else if (d && Array.isArray(d.json)) items.push(...d.json);
      } else if (body && body.items) {
        items.push(...body.items);
      } else if (body && body.json && Array.isArray(body.json)) {
        items.push(...body.json);
      }

      // Write a small debug file to help offline inspection of the raw API body
      try {
        const fs = await import('fs');
        const path = await import('path');
        const outDir = path.resolve(process.cwd(), 'data');
        const debugPath = path.join(
          outDir,
          'debug-civitai-announcements-raw.json'
        );
        fs.writeFileSync(debugPath, JSON.stringify(body, null, 2), 'utf8');
      } catch (e) {
        // ignore debug write errors
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contests: RawContest[] = items.map((it: any) => {
        const title = it.title || it.name || '';
        const endsAt = it.endsAt || it.endDate || undefined;

        // Prefer explicit action links if present (many announcements include actions -> [{ link: '/articles/123' }])
        let urlPath = '';
        try {
          if (
            it.actions &&
            Array.isArray(it.actions) &&
            it.actions.length > 0
          ) {
            const act = it.actions.find((a: unknown) => {
              if (!a || typeof a !== 'object') return false;
              const action = a as Record<string, unknown>;
              return action.link || action.url;
            });
            if (act) urlPath = act.link || act.url || '';
          }
        } catch (e) {
          // ignore
        }

        if (!urlPath) {
          urlPath =
            it.url || it.link || (it.id ? `/events/${it.id}` : '') || '';
        }

        let url = urlPath || '';
        if (url && !url.startsWith('http')) {
          if (url.startsWith('/'))
            url = `${this.config.baseUrl.replace(/\/$/, '')}${url}`;
          else url = `${this.config.baseUrl.replace(/\/$/, '')}/${url}`;
        }

        // Try to extract prize from multiple possible fields in metadata
        let prizeField = '';
        try {
          if (it.prize) prizeField = it.prize;
          else if (it.reward) prizeField = it.reward;
          else if (it.metadata && (it.metadata.prize || it.metadata.reward))
            prizeField = it.metadata.prize || it.metadata.reward;
          else if (
            it.metadata &&
            it.metadata.actions &&
            Array.isArray(it.metadata.actions)
          ) {
            // sometimes prize is encoded in link text or label
            const act = it.metadata.actions.find((a: unknown) => {
              if (!a || typeof a !== 'object') return false;
              const action = a as Record<string, unknown>;
              return (
                action.linkText &&
                /prize|reward|enter|win/i.test(action.linkText as string)
              );
            });
            if (act && act.linkText) prizeField = act.linkText;
          }
        } catch (e) {
          // ignore
        }

        // If prizeField still empty, try heuristic from title/content
        const heuristicPrize =
          !prizeField && (title || it.content)
            ? this.extractPrizeHeuristic([title || '', it.content || ''])
            : '';

        const rc: RawContest = {
          platform: this.platform,
          title: this.cleanText(title || ''),
          description: this.cleanText(
            it.content || it.description || it.summary || ''
          ),
          url,
          deadline: endsAt ? new Date(endsAt).toISOString() : undefined,
          prize: this.normalizePrize(
            this.cleanText(prizeField || heuristicPrize || '')
          ),
          rawHtml: JSON.stringify(it),
          scrapedAt: new Date().toISOString(),
          metadata: it,
        };

        return rc;
      });

      // Write converted items for offline inspection
      try {
        const fs = await import('fs');
        const path = await import('path');
        const outDir = path.resolve(process.cwd(), 'data');
        const debugPathConv = path.join(
          outDir,
          'debug-civitai-announcements-converted.json'
        );
        fs.writeFileSync(
          debugPathConv,
          JSON.stringify(contests, null, 2),
          'utf8'
        );

        // Also write validated vs unvalidated lists to help debugging why items may be dropped
        try {
          const validated = contests.filter(c => this.validateContest(c));
          const unvalidated = contests.filter(c => !this.validateContest(c));
          const debugValid = path.join(
            outDir,
            'debug-civitai-announcements-validated.json'
          );
          const debugInvalid = path.join(
            outDir,
            'debug-civitai-announcements-unvalidated.json'
          );
          fs.writeFileSync(
            debugValid,
            JSON.stringify(validated, null, 2),
            'utf8'
          );
          fs.writeFileSync(
            debugInvalid,
            JSON.stringify(unvalidated, null, 2),
            'utf8'
          );
          logger.info(
            `Announcement conversion: ${contests.length} total, ${validated.length} valid, ${unvalidated.length} invalid`
          );
        } catch (e) {
          logger.warn(
            'Failed to write validated/unvalidated announcement debug files',
            { error: e }
          );
        }
      } catch (e) {
        // ignore write errors
      }

      logger.info(
        `Converted ${contests.length} announcement items into RawContest candidates`
      );

      return contests;
    } catch (error) {
      logger.warn('Error fetching civitai announcements', { error });
      throw error;
    }
  }

  /**
   * Extract contest data from Civitai specific HTML structure
   */
  protected extractContestData(
    $element: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    $: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): RawContest {
    const title = this.extractText($element, this.config.selectors.title);
    const description = this.extractText(
      $element,
      this.config.selectors.description
    );
    const deadline = this.extractText($element, this.config.selectors.deadline);
    const prize = this.extractText($element, this.config.selectors.prize);

    // Extract URL with Civitai specific logic: try direct link, otherwise find nearest ancestor anchor
    let url = '';
    try {
      const linkElement = $element.find(this.config.selectors.link).first();
      if (linkElement && linkElement.length > 0) {
        url = linkElement.attr('href') || linkElement.data('href') || '';
      }

      // If still empty, look for nearest ancestor <a>
      if (!url) {
        const anc = $element.closest('a');
        if (anc && anc.length > 0) {
          url = anc.attr('href') || '';
        }
      }

      if (url && !url.startsWith('http')) {
        const base = (this.config.baseUrl || '').replace(/\/$/, '');
        if (url.startsWith('/')) {
          url = `${base}${url}`;
        } else {
          url = `${base}/${url}`;
        }
      }
    } catch (e) {
      url = '';
    }

    // Extract Civitai specific metadata
    const metadata = this.extractCivitaiMetadata($element, $);

    // Fallback heuristics: title may be in footer or header
    let finalTitle = title || '';
    if (!finalTitle || finalTitle.length < 3) {
      const footer = $element
        .find('[class*="AspectRatioImageCard_footer__"]')
        .first();
      if (footer && footer.length > 0) finalTitle = footer.text();
      const header = $element
        .find('[class*="AspectRatioImageCard_header__"]')
        .find('[class*="AspectRatioImageCard_header__"]')
        .first();
      if ((!finalTitle || finalTitle.length < 3) && header && header.length > 0)
        finalTitle = header.text();
    }

    // Heuristic prize extraction when selector didn't yield a value
    const heuristic =
      !prize || (typeof prize === 'string' && prize.trim().length === 0)
        ? this.extractPrizeHeuristic([finalTitle || '', $element.text() || ''])
        : '';

    const contest: RawContest = {
      platform: this.platform,
      title: this.cleanText(finalTitle || ''),
      description: this.cleanText(description || ''),
      url,
      deadline: this.parseCivitaiDate(deadline),
      prize: this.normalizePrize(this.cleanText(prize || heuristic || '')),
      rawHtml: $element.html() || '',
      scrapedAt: new Date().toISOString(),
      metadata,
    };

    return contest;
  }

  /**
   * Extract Civitai specific metadata
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractCivitaiMetadata(
    $element: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    _$: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    try {
      // Extract event type (contest, challenge, bounty, etc.)
      const typeElement = $element.find(
        '[data-testid*="type"], .event-type, .contest-type'
      );
      if (typeElement.length > 0) {
        metadata.eventType = this.cleanText(typeElement.text());
      }

      // Extract submission count
      const submissionElement = $element.find(
        '[data-testid*="submission"], .submission-count'
      );
      if (submissionElement.length > 0) {
        const submissionText = submissionElement.text();
        const submissionMatch = submissionText.match(/(\d+)/);
        if (submissionMatch) {
          metadata.submissionCount = parseInt(submissionMatch[1], 10);
        }
      }

      // Extract model requirements/categories
      const categoryElement = $element.find(
        '.category, .model-category, [data-category]'
      );
      if (categoryElement.length > 0) {
        metadata.category = this.cleanText(categoryElement.text());
      }

      // Extract NSFW rating
      const nsfwElement = $element.find('[data-nsfw], .nsfw-indicator');
      if (nsfwElement.length > 0) {
        metadata.nsfw = true;
      }

      // Extract host/creator information
      const hostElement = $element.find('.host, .creator, .event-host');
      if (hostElement.length > 0) {
        metadata.host = this.cleanText(hostElement.text());
      }

      // Extract likes/popularity metrics
      const likesElement = $element.find(
        '.likes, .thumbs-up, [data-testid*="like"]'
      );
      if (likesElement.length > 0) {
        const likesText = likesElement.text();
        const likesMatch = likesText.match(/(\d+)/);
        if (likesMatch) {
          metadata.likes = parseInt(likesMatch[1], 10);
        }
      }

      // Extract difficulty/complexity level
      const difficultyElement = $element.find('.difficulty, .complexity');
      if (difficultyElement.length > 0) {
        metadata.difficulty = this.cleanText(difficultyElement.text());
      }
    } catch (error) {
      logger.warn('Failed to extract Civitai metadata', { error });
    }

    return metadata;
  }

  /**
   * Parse Civitai date format to ISO string
   */
  private parseCivitaiDate(dateString?: string): string | undefined {
    if (!dateString) return undefined;

    try {
      // Clean common Civitai date prefixes
      const cleanDateString = dateString
        .replace(/ends?\s+/i, '')
        .replace(/deadline[：:]?\s*/i, '')
        .replace(/due[：:]?\s*/i, '')
        .trim();

      // Handle relative dates like "in 5 days", "2 weeks left"
      const relativeDateMatch = cleanDateString.match(
        /(?:in\s+)?(\d+)\s+(day|week|month|hour)s?\s*(?:left)?/i
      );
      if (relativeDateMatch) {
        const [, amount, unit] = relativeDateMatch;
        const now = new Date();
        const multiplier =
          {
            hour: 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
          }[unit.toLowerCase()] || 24 * 60 * 60 * 1000;

        const futureDate = new Date(
          now.getTime() + parseInt(amount) * multiplier
        );
        return futureDate.toISOString();
      }

      // Try standard date parsing
      const date = new Date(cleanDateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      logger.warn('Failed to parse Civitai date', { dateString, error });
    }

    return undefined;
  }

  /**
   * Enrich contest data with additional details from individual pages
   */
  private async enrichContestData(
    contests: RawContest[]
  ): Promise<RawContest[]> {
    const enrichedContests: RawContest[] = [];

    for (const contest of contests) {
      try {
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
   * Heuristic prize extraction from text snippets.
   * Looks for currency symbols or large integers like 1000, 10k, $1,000,000 etc.
   */
  private extractPrizeHeuristic(snippets: string[]): string {
    try {
      const joined = snippets.filter(Boolean).join(' | ');

      // common patterns: $1,000 ; 1000 USD ; 10k ; 1.2M ; 1000000
      const currencyMatch = joined.match(/\$\s?[\d,]+(?:\.\d+)?/);
      if (currencyMatch) return currencyMatch[0].replace(/[,\s]/g, '');

      const compactMatch = joined.match(/(\d+[.,]?\d*\s*(?:k|m|K|M))/);
      if (compactMatch) return compactMatch[0];

      const plainNum = joined.match(/\b(\d{3,})(?:\b|\s|,)/);
      if (plainNum) return plainNum[1];
    } catch (e) {
      // ignore heuristic failures
    }

    return '';
  }

  // new: normalize prize strings into canonical numeric-ish strings when possible
  private normalizePrize(input?: string): string {
    if (!input) return '';
    try {
      let s = String(input).trim();
      s = s.replace(/<[^>]*>/g, '').trim();

      // currency like $1,234.56
      const currencyMatch = s.match(/([$€£¥])\s*([\d,.]+)/);
      if (currencyMatch) {
        const num = currencyMatch[2].replace(/,/g, '');
        if (!isNaN(Number(num))) return String(Math.round(Number(num)));
      }

      // compact like 1.2k or 2M
      const compactMatch = s.match(/([\d,.]+)\s*([kKmM])/);
      if (compactMatch) {
        const raw = compactMatch[1].replace(/,/g, '');
        const n = parseFloat(raw);
        if (!isNaN(n)) {
          const mult = compactMatch[2].toLowerCase() === 'k' ? 1e3 : 1e6;
          return String(Math.round(n * mult));
        }
      }

      // plain numbers with commas
      const plainMatch = s.match(/([\d,]+(?:\.\d+)?)/);
      if (plainMatch) {
        const val = plainMatch[1].replace(/,/g, '');
        if (!isNaN(Number(val))) return String(Math.round(Number(val)));
      }

      return s.substring(0, 64);
    } catch (e) {
      return (input || '').toString().trim();
    }
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

      // Extract detailed description from main content area
      const detailedDesc = $(
        '.event-description, .content-description, main .description'
      ).text();
      if (
        detailedDesc &&
        detailedDesc.length > (contest.description || '').length
      ) {
        contest.description = this.cleanText(detailedDesc);
      }

      // Extract detailed prize information
      const prizeDetails = $(
        '.prize-pool, .reward-details, .bounty-amount'
      ).text();
      if (prizeDetails && prizeDetails.length > (contest.prize || '').length) {
        contest.prize = this.normalizePrize(this.cleanText(prizeDetails));
      }

      // Extract submission requirements
      const requirements = $('.requirements, .rules, .submission-rules').text();
      if (requirements) {
        contest.metadata.requirements = this.cleanText(requirements);
      }

      // Extract judging criteria
      const judgingCriteria = $('.judging, .criteria, .evaluation').text();
      if (judgingCriteria) {
        contest.metadata.judgingCriteria = this.cleanText(judgingCriteria);
      }

      // Extract additional model requirements
      const modelReqs = $('.model-requirements, .tech-requirements').text();
      if (modelReqs) {
        contest.metadata.modelRequirements = this.cleanText(modelReqs);
      }

      // Extract entry count from detail page
      const entryCountElement = $(
        '.entry-count, .submission-count, .participant-count'
      );
      if (entryCountElement.length > 0) {
        const entryText = entryCountElement.text();
        const entryMatch = entryText.match(/(\d+)/);
        if (entryMatch) {
          contest.metadata.entryCount = parseInt(entryMatch[1], 10);
        }
      }
    } catch (error) {
      logger.warn('Failed to extract detailed Civitai information', { error });
    }

    return contest;
  }

  /**
   * Validate Civitai specific contest data
   */
  protected validateContest(contest: RawContest): boolean {
    if (!super.validateContest(contest)) {
      return false;
    }

    // Civitai specific validations
    if (!contest.title || contest.title.length < 3) {
      logger.debug('Contest title too short', { title: contest.title });
      return false;
    }

    // Check if URL is actually a Civitai URL
    if (contest.url && !contest.url.includes('civitai.com')) {
      logger.debug('Contest URL is not from Civitai', { url: contest.url });
      return false;
    }

    // Filter out expired events (if we can determine the status)
    const metadata = contest.metadata as Record<string, unknown> | undefined;
    if (
      metadata &&
      typeof metadata.status === 'string' &&
      metadata.status.toLowerCase().includes('expired')
    ) {
      logger.debug('Contest is expired', { title: contest.title });
      return false;
    }

    return true;
  }
}
