import { normalizeUrl, normalizePrize, parseRelativeDate } from '../src/utils/scraperUtils';

describe('scraperUtils', () => {
  test('normalizeUrl converts relative to absolute', () => {
    const base = 'https://civitai.com/';
    expect(normalizeUrl('/articles/123', base)).toBe('https://civitai.com/articles/123');
    expect(normalizeUrl('articles/123', base)).toBe('https://civitai.com/articles/123');
    expect(normalizeUrl('https://civitai.com/articles/1', base)).toBe('https://civitai.com/articles/1');
  });

  test('normalizePrize parses k/M and numbers', () => {
    expect(normalizePrize('$1,234').normalized).toBe('1234');
    expect(normalizePrize('1.5k').normalized).toBe('1500');
    expect(normalizePrize('2M').normalized).toBe('2000000');
    expect(normalizePrize('Enter now!').normalized).toBe('');
  });

  test('parseRelativeDate parses relative and absolute', () => {
    const iso = new Date().toISOString();
    // absolute
    const parsed = parseRelativeDate('Aug 20, 2025');
    expect(parsed).toBe(new Date('Aug 20, 2025').toISOString());

    // relative
    const rel = parseRelativeDate('in 2 days');
    expect(rel).not.toBeNull();
    const d = new Date(rel!);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(diff).toBeGreaterThanOrEqual(1.9);
    expect(diff).toBeLessThanOrEqual(2.1);
  });
});
