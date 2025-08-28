import { cleanText } from './index';

export function normalizeUrl(rawUrl: string, baseUrl: string): string {
  if (!rawUrl) return '';
  rawUrl = rawUrl.trim();
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  const base = baseUrl.replace(/\/$/, '');
  if (rawUrl.startsWith('/')) return base + rawUrl;
  // if no protocol and no leading slash, assume relative as well
  return base + '/' + rawUrl;
}

export function normalizePrize(input?: string): {
  normalized?: string;
  raw?: string;
} {
  if (!input) return { normalized: '', raw: '' };
  const raw = cleanText(input);
  const s = raw.replace(/[,\s]+/g, '');

  // match currency like $1,234 or €2.5k
  const currencyMatch = s.match(/^[^0-9]*(\d+(?:\.\d+)?)([kKmM])?$/);
  if (!currencyMatch) {
    return { normalized: '', raw };
  }

  const num = parseFloat(currencyMatch[1]);
  const unit = currencyMatch[2];
  let value = num;
  if (unit) {
    if (unit.toLowerCase() === 'k') value = Math.round(num * 1000);
    if (unit.toLowerCase() === 'm') value = Math.round(num * 1000000);
  }

  return { normalized: String(Math.round(value)), raw };
}

export function parseRelativeDate(text: string): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  // absolute ISO or common formats
  const iso = Date.parse(text);
  if (!isNaN(iso)) return new Date(iso).toISOString();

  // relative: in N days/weeks
  const m = t.match(/in\s+(\d+)\s+(day|days|week|weeks|month|months)/);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2];
    const now = new Date();
    if (unit.startsWith('day')) now.setDate(now.getDate() + n);
    else if (unit.startsWith('week')) now.setDate(now.getDate() + n * 7);
    else if (unit.startsWith('month')) now.setMonth(now.getMonth() + n);
    return now.toISOString();
  }

  const leftMatch = t.match(
    /(\d+)\s+(day|days|week|weeks|month|months)\s+left/
  );
  if (leftMatch) {
    const n = parseInt(leftMatch[1], 10);
    const unit = leftMatch[2];
    const now = new Date();
    if (unit.startsWith('day')) now.setDate(now.getDate() + n);
    else if (unit.startsWith('week')) now.setDate(now.getDate() + n * 7);
    else if (unit.startsWith('month')) now.setMonth(now.getMonth() + n);
    return now.toISOString();
  }

  return null;
}
