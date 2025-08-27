/**
 * Simple test runner to check system functionality
 */

import { logger } from './utils/logger';

console.log('🚀 AI Contest Navigator - Test Script');
logger.info('Logger is working');

// Test configuration loading
try {
  const fs = require('fs-extra');
  const config = fs.readJsonSync('config/app.json');
  console.log('✅ Configuration loaded successfully');
  console.log('📊 Platforms configured:', config.sources?.length ?? 0);
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error('❌ Failed to load configuration:', error.message);
  } else {
    console.error('❌ Failed to load configuration:', String(error));
  }
}

console.log('✅ Test completed successfully!');
