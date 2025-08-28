/**
 * Data Validator
 * Validates contest data integrity and consistency
 */

import {
  RawContest,
  ProcessedContest,
  ValidationResult,
  ValidationRule,
  ValidationIssue,
} from '../types';
import { logger } from '../utils/logger';

export class DataValidator {
  private rules: ValidationRule[];

  constructor() {
    this.rules = this.initializeRules();
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): ValidationRule[] {
    return [
      {
        name: 'required_fields',
        description: 'Check required fields are present',
        validator: this.validateRequiredFields.bind(this),
      },
      {
        name: 'url_format',
        description: 'Validate URL format',
        validator: this.validateUrlFormat.bind(this),
      },
      {
        name: 'date_format',
        description: 'Validate date format and logic',
        validator: this.validateDateFormat.bind(this),
      },
      {
        name: 'status_values',
        description: 'Validate status values',
        validator: this.validateStatusValues.bind(this),
      },
      {
        name: 'platform_consistency',
        description: 'Validate platform consistency',
        validator: this.validatePlatformConsistency.bind(this),
      },
      {
        name: 'duplicate_detection',
        description: 'Detect duplicate contests',
        validator: this.validateDuplicates.bind(this),
      },
    ];
  }

  /**
   * Validate raw contest data
   */
  async validateRawContests(contests: RawContest[]): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalContests: contests.length,
        validContests: 0,
        invalidContests: 0,
        warningContests: 0,
      },
    };

    logger.info(`Starting validation of ${contests.length} raw contests`);

    for (let i = 0; i < contests.length; i++) {
      const contest = contests[i];
      const contestErrors: string[] = [];
      const contestWarnings: string[] = [];

      // Run all validation rules
      for (const rule of this.rules) {
        try {
          const ruleResult = await rule.validator(contest, i, contests);

          if (ruleResult.errors && ruleResult.errors.length > 0) {
            contestErrors.push(...ruleResult.errors);
          }

          if (ruleResult.warnings && ruleResult.warnings.length > 0) {
            contestWarnings.push(...ruleResult.warnings);
          }
        } catch (error) {
          contestErrors.push(`Rule '${rule.name}' failed: ${error}`);
        }
      }

      // Update result
      if (contestErrors.length > 0) {
        result.errors.push({
          index: i,
          contest: contest.title || `Contest #${i}`,
          issues: contestErrors,
        });
        result.summary.invalidContests++;
        result.isValid = false;
      } else if (contestWarnings.length > 0) {
        result.warnings.push({
          index: i,
          contest: contest.title || `Contest #${i}`,
          issues: contestWarnings,
        });
        result.summary.warningContests++;
        result.summary.validContests++;
      } else {
        result.summary.validContests++;
      }
    }

    logger.info('Validation completed', result.summary);
    return result;
  }

  /**
   * Validate processed contest data
   */
  async validateProcessedContests(
    contests: ProcessedContest[]
  ): Promise<ValidationResult> {
    // Convert to raw format for validation
    const rawContests: RawContest[] = contests.map(contest => ({
      platform: contest.platform,
      title: contest.title,
      description: contest.description,
      url: contest.url,
      deadline: contest.deadline,
      status: contest.status,
      prize: contest.prize,
      scrapedAt: contest.scrapedAt,
      metadata: {},
    }));

    const result = await this.validateRawContests(rawContests);

    // Additional validation for processed contests
    for (let i = 0; i < contests.length; i++) {
      const contest = contests[i];
      const additionalErrors: string[] = [];

      // Check AI-generated fields
      if (!contest.summary) {
        additionalErrors.push('Missing AI summary');
      }

      if (!contest.tags || contest.tags.length === 0) {
        additionalErrors.push('Missing tags');
      }

      if (!contest.contestType) {
        additionalErrors.push('Missing contest type');
      }

      if (additionalErrors.length > 0) {
        const existingError = result.errors.find(
          (e: ValidationIssue) => e.index === i
        );
        if (existingError) {
          existingError.issues.push(...additionalErrors);
        } else {
          result.errors.push({
            index: i,
            contest: contest.title || `Contest #${i}`,
            issues: additionalErrors,
          });
          result.summary.invalidContests++;
          result.summary.validContests--;
        }
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Validate required fields
   */
  private async validateRequiredFields(
    contest: RawContest,
    index: number
  ): Promise<{ errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const requiredFields = ['title', 'url', 'platform'];
    const recommendedFields = ['description', 'deadline', 'status'];

    // Check required fields
    for (const field of requiredFields) {
      if (!contest[field as keyof RawContest]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check recommended fields
    for (const field of recommendedFields) {
      if (!contest[field as keyof RawContest]) {
        warnings.push(`Missing recommended field: ${field}`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate URL format
   */
  private async validateUrlFormat(
    contest: RawContest
  ): Promise<{ errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];

    if (contest.url) {
      try {
        new URL(contest.url);

        // Check if URL is accessible (basic check)
        if (
          !contest.url.startsWith('http://') &&
          !contest.url.startsWith('https://')
        ) {
          errors.push('URL must start with http:// or https://');
        }
      } catch {
        errors.push('Invalid URL format');
      }
    }

    return { errors };
  }

  /**
   * Validate date format and logic
   */
  private async validateDateFormat(
    contest: RawContest
  ): Promise<{ errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const dateFields = ['deadline', 'startDate', 'endDate'];

    for (const field of dateFields) {
      const dateValue = contest[field as keyof RawContest] as string;

      if (dateValue) {
        const date = new Date(dateValue);

        if (isNaN(date.getTime())) {
          errors.push(`Invalid date format in ${field}: ${dateValue}`);
        } else {
          // Check if date is in the past (for deadlines)
          if (field === 'deadline' && date < new Date()) {
            warnings.push(`Deadline is in the past: ${dateValue}`);
          }

          // Check if start date is after end date
          if (field === 'startDate' && contest.endDate) {
            const endDate = new Date(contest.endDate);
            if (!isNaN(endDate.getTime()) && date > endDate) {
              errors.push('Start date is after end date');
            }
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate status values
   */
  private async validateStatusValues(
    contest: RawContest
  ): Promise<{ errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];
    const validStatuses = ['active', 'upcoming', 'ended', 'cancelled'];

    if (contest.status && !validStatuses.includes(contest.status)) {
      errors.push(
        `Invalid status value: ${contest.status}. Must be one of: ${validStatuses.join(', ')}`
      );
    }

    return { errors };
  }

  /**
   * Validate platform consistency
   */
  private async validatePlatformConsistency(
    contest: RawContest
  ): Promise<{ errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];
    const platformDomains = {
      modelscope: ['modelscope.cn'],
      civitai: ['civitai.com'],
      openart: ['openart.ai'],
    };

    if (contest.platform && contest.url) {
      const expectedDomains =
        platformDomains[
          contest.platform.toLowerCase() as keyof typeof platformDomains
        ];

      if (expectedDomains) {
        const urlDomain = new URL(contest.url).hostname.toLowerCase();
        const isValidDomain = expectedDomains.some(domain =>
          urlDomain.includes(domain)
        );

        if (!isValidDomain) {
          errors.push(
            `URL domain doesn't match platform: expected ${expectedDomains.join(' or ')}, got ${urlDomain}`
          );
        }
      }
    }

    return { errors };
  }

  /**
   * Detect duplicate contests
   */
  private async validateDuplicates(
    contest: RawContest,
    index: number,
    allContests?: RawContest[]
  ): Promise<{ errors?: string[]; warnings?: string[] }> {
    const warnings: string[] = [];

    if (!allContests) {
      return { warnings };
    }

    // Check for duplicates by URL
    const duplicatesByUrl = allContests.filter(
      (c, i) => i !== index && c.url === contest.url
    );

    if (duplicatesByUrl.length > 0) {
      warnings.push(`Potential duplicate found by URL: ${contest.url}`);
    }

    // Check for duplicates by title (similar titles)
    if (contest.title && contest.title.length > 10) {
      const duplicatesByTitle = allContests.filter(
        (c, i) =>
          i !== index &&
          c.title &&
          this.calculateSimilarity(contest.title!, c.title) > 0.8
      );

      if (duplicatesByTitle.length > 0) {
        warnings.push(`Potential duplicate found by title similarity`);
      }
    }

    return { warnings };
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get validation summary
   */
  getValidationSummary(result: ValidationResult): string {
    const { summary } = result;

    return `
Validation Summary:
- Total Contests: ${summary.totalContests}
- Valid Contests: ${summary.validContests}
- Invalid Contests: ${summary.invalidContests}
- Contests with Warnings: ${summary.warningContests}
- Overall Status: ${result.isValid ? 'PASS' : 'FAIL'}

${
  result.errors.length > 0
    ? `
Errors Found:
${result.errors.map((e: ValidationIssue) => `- Contest "${e.contest}" (${e.index}): ${e.issues.join(', ')}`).join('\n')}
`
    : ''
}

${
  result.warnings.length > 0
    ? `
Warnings:
${result.warnings.map((w: ValidationIssue) => `- Contest "${w.contest}" (${w.index}): ${w.issues.join(', ')}`).join('\n')}
`
    : ''
}
    `.trim();
  }
}
