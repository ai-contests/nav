import { CivitaiScraper } from '../scrapers/CivitaiScraper';
import { PlatformConfig } from '../types';
import { logger } from '../utils/logger';
import * as fs from 'fs-extra';
import * as path from 'path';

async function runCivitai() {
  try {
    logger.info('Starting Civitai scraper (script)');

    const configPath = path.join(
      __dirname,
      '..',
      '..',
      'config',
      'sources.json'
    );
    const configData = await fs.readJson(configPath);
    const civitaiConfig: PlatformConfig = configData.platforms.civitai;
    if (!civitaiConfig) throw new Error('Civitai configuration not found');

    const scraper = new CivitaiScraper(civitaiConfig);
    const contests = await scraper.scrape();

    const outputPath = path.join(
      __dirname,
      '..',
      '..',
      'data',
      'raw',
      'civitai-latest.json'
    );
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJson(
      outputPath,
      { platform: 'civitai', scrapedAt: new Date().toISOString(), contests },
      { spaces: 2 }
    );

    console.log(`Civitai done: ${contests.length} contests -> ${outputPath}`);
  } catch (err) {
    logger.error('run-civitai script failed', { error: err });
    process.exit(1);
  }
}

if (require.main === module) {
  runCivitai()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runCivitai };
