import { ModelScopeScraper } from '../scrapers/ModelScopeScraper';
import { PlatformConfig } from '../types';
import { logger } from '../utils/logger';
import * as fs from 'fs-extra';
import * as path from 'path';

async function runModelScope() {
  try {
    logger.info('Starting ModelScope scraper (script)');

    const configPath = path.join(
      __dirname,
      '..',
      '..',
      'config',
      'sources.json'
    );
    const configData = await fs.readJson(configPath);
    const modelscopeConfig: PlatformConfig = configData.platforms.modelscope;
    if (!modelscopeConfig)
      throw new Error('ModelScope configuration not found');

    const scraper = new ModelScopeScraper(modelscopeConfig);
    const contests = await scraper.scrape();

    const outputPath = path.join(
      __dirname,
      '..',
      '..',
      'data',
      'raw',
      'modelscope-latest.json'
    );
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJson(
      outputPath,
      { platform: 'modelscope', scrapedAt: new Date().toISOString(), contests },
      { spaces: 2 }
    );

    console.log(
      `ModelScope done: ${contests.length} contests -> ${outputPath}`
    );
  } catch (err) {
    logger.error('run-modelscope script failed', { error: err });
    process.exit(1);
  }
}

if (require.main === module) {
  runModelScope()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runModelScope };
