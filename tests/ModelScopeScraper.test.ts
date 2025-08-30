// Prevent Puppeteer from actually launching during tests
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setUserAgent: jest.fn(),
      setViewport: jest.fn(),
      goto: jest.fn(),
      waitForSelector: jest.fn(),
      waitForTimeout: jest.fn(),
      content: jest.fn().mockResolvedValue('<html></html>'),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));

import { ModelScopeScraper } from '../src/scrapers/ModelScopeScraper';

// Minimal fake config
const fakeConfig: any = {
  name: 'modelscope',
  baseUrl: 'https://modelscope.cn',
  selectors: {},
  debugExtraction: false,
  delay: 0,
  contestListUrl: '',
  maxRetries: 1,
};

describe('ModelScopeScraper.parseModelScopeDate', () => {
  const s = new ModelScopeScraper(fakeConfig) as any;

  test('parses ISO-like YYYY-MM-DD HH:mm', () => {
    const parsed = s.parseModelScopeDate('2025-09-21 14:59');
    expect(parsed).toBeTruthy();
    expect(parsed!.startsWith('2025-09-21T')).toBe(true);
  });

  test('parses Chinese date YYYY年M月D日', () => {
    const parsed = s.parseModelScopeDate('2024年12月02日');
    // The parsing may normalize to UTC or local-time depending on environment; accept either UTC or local date '2024-12-02'
    expect(parsed).toBeDefined();
    const parsedDate = new Date(parsed!);
    const utcDate = parsedDate.toISOString().slice(0, 10);
    const localDate = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
    expect(utcDate === '2024-12-02' || localDate === '2024-12-02').toBe(true);
  });

  test('returns undefined for invalid input', () => {
    const parsed = s.parseModelScopeDate('not a date');
    expect(parsed).toBeUndefined();
  });
});
