/**
 * Test AI processing functionality
 */

import { StorageManager } from './storage/StorageManager';
import { MockAIProcessor } from './processors/MockAIProcessor';
import { AppConfig } from './types';
import fs from 'fs-extra';

async function testAIProcessing() {
  console.log('🤖 Testing AI processing...');

  try {
    const config: AppConfig = await fs.readJson('config/app.json');

    const storageManager = new StorageManager(config.storage);
    const aiProcessor = new MockAIProcessor(config.aiProcessor);

    // Load raw data
    const rawContests = await storageManager.loadRawContests();
    console.log(`📂 Loaded ${rawContests.length} raw contests`);

    if (rawContests.length === 0) {
      console.log('ℹ️  No raw data found to process');
      return;
    }

    // Process with AI
    console.log('🔄 Processing contests...');
    const processedContests = await aiProcessor.processContests(rawContests);
    console.log(`✅ Processed ${processedContests.length} contests`);

    // Display results
    for (let i = 0; i < processedContests.length; i++) {
      const contest = processedContests[i];
      console.log(`\n📋 Contest ${i + 1}:`);
      console.log(`- Title: ${contest.title}`);
      console.log(`- Type: ${contest.contestType}`);
      console.log(`- Difficulty: ${contest.difficulty}`);
      console.log(`- Tags: ${contest.tags.join(', ')}`);
      console.log(`- AI Tools: ${contest.aiTools?.join(', ')}`);
      console.log(`- Quality Score: ${contest.qualityScore}/10`);
      console.log(`- Summary: ${contest.summary}`);
    }

    // Save processed data
    console.log('\n💾 Saving processed data...');
    const saveResult =
      await storageManager.saveProcessedContests(processedContests);

    if (saveResult.success) {
      console.log(
        `✅ Saved ${saveResult.contestCount} contests to: ${saveResult.filePath}`
      );
    } else {
      console.log(`❌ Save failed: ${saveResult.message}`);
    }

    console.log('\n✅ AI processing test completed!');
  } catch (error) {
    if (error instanceof Error) console.error('❌ Test failed:', error.message);
    else console.error('❌ Test failed:', String(error));
  }
}

testAIProcessing();
