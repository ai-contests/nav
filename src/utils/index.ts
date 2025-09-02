/**
 * Utility functions for the AI Contests Navigator
 * Common helper functions used across modules
 */

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate unique ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  const urlRegex = /^https?:\/\/.+/;
  return urlRegex.test(url);
}

/**
 * Clean and normalize text
 */
export function cleanText(text: string): string {
  if (!text) return '';

  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespaces with single space
    .replace(/\n+/g, ' ') // Replace newlines with space
    .trim();
}

/**
 * Parse date string to ISO format
 */
export function parseDate(dateString: string): string | null {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
      await sleep(delay);
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error('All retry attempts failed');
}

/**
 * Create error with additional context
 */
export function createError(
  message: string,
  context?: Record<string, unknown>
): Error {
  const error = new Error(message);
  if (context) {
    (error as Error & { context: Record<string, unknown> }).context = context;
  }
  return error;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Deep merge objects
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        (result as Record<string, unknown>)[key],
        source[key] as Partial<unknown>
      );
    } else {
      (result as Record<string, unknown>)[key] = source[key];
    }
  }

  return result;
}
