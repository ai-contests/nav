/**
 * Test script for pipeline functionality
 */

import { SourceManager } from './sources/SourceManager';
import { ScraperManager } from './scrapers/ScraperManager';
import { MockAIProcessor } from './processors/MockAIProcessor';
import { StorageManager } from './storage/StorageManager';
import { DataValidator } from './validators/DataValidator';
import { AppConfig, RawContest } from './types';
import { logger } from './utils/logger';

async function testPipeline() {
  console.log('🧪 Testing AI Contest Navigator Pipeline');

  try {
    // Load configuration
    const fs = require('fs-extra');
    const config: AppConfig = await fs.readJson('config/app.json');

    // Initialize components
    const sourceManager = new SourceManager(config.sources);
    const scraperManager = new ScraperManager(sourceManager);
    const aiProcessor = new MockAIProcessor(config.aiProcessor);
    const storageManager = new StorageManager(config.storage);
    const dataValidator = new DataValidator();

    console.log('✅ Components initialized');

    // Test 1: Load existing raw data
    console.log('\n📂 Testing data loading...');
    const rawContests = await storageManager.loadRawContests();
    console.log(`Found ${rawContests.length} raw contests`);

    if (rawContests.length === 0) {
      console.log(
        'ℹ️  No existing data found. You can add test data to data/raw/ directory'
      );
      return;
    }

    // Test 2: Validate data
    console.log('\n🔍 Testing data validation...');
    const validationResult =
      await dataValidator.validateRawContests(rawContests);
    console.log(`Validation: ${validationResult.isValid ? 'PASS' : 'FAIL'}`);
    console.log(
      `Valid: ${validationResult.summary.validContests}, Invalid: ${validationResult.summary.invalidContests}`
    );

    // Test 3: Process with Mock AI
    console.log('\n🤖 Testing AI processing...');
    const processedContests = await aiProcessor.processContests(rawContests);
    console.log(`Processed ${processedContests.length} contests`);

    // Test 4: Save processed data
    console.log('\n💾 Testing data storage...');
    const saveResult =
      await storageManager.saveProcessedContests(processedContests);
    if (saveResult.success) {
      console.log(`✅ Saved to: ${saveResult.filePath}`);
    } else {
      console.log(`❌ Save failed: ${saveResult.message}`);
    }

    // Test 5: Export data
    console.log('\n📤 Testing data export...');
    const exportPath = await storageManager.exportData('json');
    console.log(`✅ Exported to: ${exportPath}`);

    // Test 6: Storage stats
    console.log('\n📊 Storage statistics:');
    const stats = await storageManager.getStorageStats();
    console.log(`- Raw files: ${stats.rawFiles}`);
    console.log(`- Processed files: ${stats.processedFiles}`);
    console.log(
      `- Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`
    );

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testPipeline();
