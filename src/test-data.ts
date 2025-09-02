/**
 * Simple data loading test
 */

import { StorageManager } from './storage/StorageManager';
import { AppConfig } from './types';
import fs from 'fs-extra';

async function testDataLoading() {
  console.log('📂 Testing data loading...');

  try {
    const config: AppConfig = await fs.readJson('config/app.json');

    const storageManager = new StorageManager(config.storage);

    // Test loading raw data
    const rawContests = await storageManager.loadRawContests();
    console.log(`✅ Loaded ${rawContests.length} raw contests`);

    if (rawContests.length > 0) {
      console.log('📋 First contest:');
      console.log(`- Title: ${rawContests[0].title}`);
      console.log(`- Platform: ${rawContests[0].platform}`);
      console.log(`- URL: ${rawContests[0].url}`);
    }

    // Test storage stats
    const stats = await storageManager.getStorageStats() as {
      rawFiles?: number;
      platforms?: string[];
      totalSize?: number;
    };
    console.log('\n📊 Storage stats:');
    console.log(`- Raw files: ${stats.rawFiles}`);
    console.log(`- Platforms: ${stats.platforms?.join(', ')}`);
    console.log(`- Total size: ${(stats.totalSize || 0 / 1024).toFixed(2)} KB`);

    console.log('\n✅ Data loading test completed!');
  } catch (error) {
    if (error instanceof Error) console.error('❌ Test failed:', error.message);
    else console.error('❌ Test failed:', String(error));
  }
}

testDataLoading();
