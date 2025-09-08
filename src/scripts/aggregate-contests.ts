import fs from 'fs-extra';
import path from 'path';

type RawContest = Record<string, unknown>;

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function asStringLower(v: unknown, fallback = 'unknown'): string {
  const s = asString(v);
  return s ? s.toLowerCase() : fallback;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function normalizeContest(c: RawContest) {
  const id = asString(c.id) || asString(c.url) || asString(c.originalUrl) || `${asStringLower(c.platform)}-${Math.random().toString(36).slice(2, 9)}`;
  const title = asString(c.title) || asString(c.name) || 'Untitled contest';
  const platform = asStringLower(c.platform || (c.source as unknown));
  const status = asString(c.status) || 'active';
  const description = asString(c.description) || asString(c.summary) || '';
  const startDate = asString(c.startDate) || null;
  const endDate = asString(c.endDate) || asString(c.deadline) || null;
  const prize = asString(c.prize) || null;
  const tagsSrc = (c.tags !== undefined) ? c.tags : ((c.metadata as { tags?: unknown } | undefined)?.tags ?? undefined);
  const tags = asArray(tagsSrc as unknown).map(t => asString(t) || '').filter(Boolean);
  const url = asString(c.url) || asString(c.originalUrl) || null;
  const qualityScore = typeof c.qualityScore === 'number' ? c.qualityScore : (typeof c.quality === 'number' ? c.quality : null);
  const lastUpdated = asString(c.lastUpdated) || asString(c.processedAt) || null;

  return {
    id,
    title,
    platform,
    status,
    description,
    startDate,
    endDate,
    prize,
    tags,
    url,
    qualityScore,
    lastUpdated,
  };
}

async function aggregate() {
  const rawDir = path.join(process.cwd(), 'data', 'raw');
  const processedDir = path.join(process.cwd(), 'data', 'processed');
  await fs.ensureDir(processedDir);

  if (!await fs.pathExists(rawDir)) {
    console.error('no raw data directory:', rawDir);
    process.exit(1);
  }

  const files = (await fs.readdir(rawDir)).filter(f => f.endsWith('.json'));
  const all: ReturnType<typeof normalizeContest>[] = [];

  for (const f of files) {
    try {
      const full = path.join(rawDir, f);
      const data = await fs.readJson(full);
      let items: unknown[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && typeof data === 'object') {
        const maybeContests = (data as { contests?: unknown }).contests;
        if (Array.isArray(maybeContests)) items = maybeContests;
      }

      for (const it of items) {
        if (it && typeof it === 'object') {
          all.push(normalizeContest(it as RawContest));
        }
      }
    } catch (err) {
      console.warn('skip', f, err.message);
    }
  }

  // dedupe by url or id
  const seen = new Set<string>();
  const deduped = all.filter(c => {
    const key = (c.url || c.id || '').toString();
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const out = {
    generatedAt: new Date().toISOString(),
    count: deduped.length,
    contests: deduped,
  };

  const outPath = path.join(process.cwd(), 'data', 'processed', 'all-contests-latest.json');
  await fs.writeJson(outPath, out, { spaces: 2 });
  console.log(`wrote ${deduped.length} contests -> ${outPath}`);
}

if (require.main === module) {
  aggregate().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
