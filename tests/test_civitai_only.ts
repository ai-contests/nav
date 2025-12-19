
import { CivitaiScraper } from '../src/scrapers/CivitaiScraper';
import { logger } from '../src/utils/logger';


// Mock config
const config = {
  platform: 'civitai',
  name: 'civitai',
  displayName: 'Civitai',
  enabled: true,
  delay: 1000,
  maxRetries: 3,
  baseUrl: 'https://civitai.com',
  contestListUrl: 'https://civitai.com/events',
  selectors: {
    contestItems: 'a[href^="/events/"]',
    title: 'h1',
    description: '.event-description',
    deadline: '.time-remaining',
    prize: '.prize-pool',
    link: 'a'
  }
};

async function main() {
  try {
    logger.info('Initializing Civitai Scraper test...');
    const scraper = new CivitaiScraper(config);
    
    // Attempt scrape
    logger.info('Running scrape()...');
    const contests = await scraper.scrape();
    
    logger.info('Scrape Results:', { results: JSON.stringify(contests, null, 2) });
  } catch (error) {
    logger.error('Test failed', { error });
  }
}

main();
