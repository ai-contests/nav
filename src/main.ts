/**
 * Main Application Entry Point
 * AI Contest Navigator - Command Line Interface
 */

import { Command } from 'commander';
import * as fs from 'fs-extra';
import { ContestPipeline } from './pipeline/ContestPipeline';
import { AppConfig } from './types';
import { logger } from './utils/logger';

const program = new Command();

/**
 * Load application configuration
 */
async function loadConfig(
  configPath: string = 'config/app.json'
): Promise<AppConfig> {
  try {
    const configExists = await fs.pathExists(configPath);
    if (!configExists) {
      logger.error(`Configuration file not found: ${configPath}`);
      process.exit(1);
    }

    const config = await fs.readJson(configPath);

    // Ensure required directories exist
    await fs.ensureDir(config.storage.dataDir);
    await fs.ensureDir('logs');

    return config;
  } catch (error) {
    logger.error(`Failed to load configuration: ${error}`);
    process.exit(1);
  }
}

/**
 * Display pipeline status
 */
async function showStatus(pipeline: ContestPipeline): Promise<void> {
  try {
    const status = await pipeline.getStatus();

    console.log('\n📊 AI Contest Navigator - System Status');
    console.log('═'.repeat(50));

    console.log('\n📂 Storage:');
    const storage = status.storage as {
      rawFiles?: number;
      processedFiles?: number;
      backupFiles?: number;
      totalSize?: number;
      lastUpdate?: string | null;
      platforms?: string[];
    };
    console.log(`  Raw Files: ${storage.rawFiles || 0}`);
    console.log(`  Processed Files: ${storage.processedFiles || 0}`);
    console.log(`  Backup Files: ${storage.backupFiles || 0}`);
    console.log(
      `  Total Size: ${((storage.totalSize || 0) / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`  Last Update: ${storage.lastUpdate || 'Never'}`);

    console.log('\n🌐 Platforms:');
    (storage.platforms || []).forEach((platform: string) => {
      console.log(`  ✓ ${platform}`);
    });

    console.log('\n🤖 AI Processor:');
    const aiProcessor = status.aiProcessor as {
      config?: {
        apiEndpoint?: string;
        maxTokens?: number;
        batchSize?: number;
      };
    };
    console.log(
      `  Endpoint: ${aiProcessor.config?.apiEndpoint || 'Not configured'}`
    );
    console.log(`  Max Tokens: ${aiProcessor.config?.maxTokens || 0}`);
    console.log(`  Batch Size: ${aiProcessor.config?.batchSize || 0}`);

    console.log('\n⏰ Last Check:', status.lastCheck);
    console.log('═'.repeat(50));
  } catch (error) {
    logger.error('Failed to get status', { error });
    console.error('❌ Failed to get system status');
  }
}

/**
 * Display execution results
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function displayResults(result: any): void {
  const { success, duration, stats, errors, warnings } = result;

  console.log('\n🎯 Execution Results');
  console.log('═'.repeat(50));
  console.log(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log('');
  console.log('📈 Statistics:');
  console.log(`  Crawled: ${stats.crawled} contests`);
  console.log(`  Processed: ${stats.processed} contests`);
  console.log(`  Validated: ${stats.validated} contests`);
  console.log(`  Saved: ${stats.saved} contests`);
  console.log(`  Generated: ${stats.generated} items`);
  console.log(`  Errors: ${stats.errors}`);
  console.log(`  Warnings: ${stats.warnings}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((error: string) => console.log(`  • ${error}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach((warning: string) => console.log(`  • ${warning}`));
  }

  console.log('═'.repeat(50));
}

// Configure CLI commands
program
  .name('ai-contest')
  .description('AI Contest Navigator - Discover and track AI/ML competitions')
  .version('1.0.0');

program
  .command('run')
  .description('Run the complete pipeline (crawl, process, generate)')
  .option('-c, --config <path>', 'Configuration file path', 'config/app.json')
  .option(
    '-m, --mode <mode>',
    'Execution mode (full|crawl-only|process-only|generate-only)',
    'full'
  )
  .action(async options => {
    try {
      console.log('🚀 Starting AI Contest Navigator...');

      const config = await loadConfig(options.config);
      const pipeline = new ContestPipeline(config);

      logger.info(`Starting pipeline execution in ${options.mode} mode`);

      const result = await pipeline.execute(options.mode);
      displayResults(result);

      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      logger.error('Pipeline execution failed', { error });
      console.error('❌ Pipeline execution failed:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show system status and statistics')
  .option('-c, --config <path>', 'Configuration file path', 'config/app.json')
  .action(async options => {
    try {
      const config = await loadConfig(options.config);
      const pipeline = new ContestPipeline(config);

      await showStatus(pipeline);
    } catch (error) {
      logger.error('Failed to get status', { error });
      console.error('❌ Failed to get status:', error);
      process.exit(1);
    }
  });

program
  .command('crawl')
  .description('Crawl contest data from all platforms')
  .option('-c, --config <path>', 'Configuration file path', 'config/app.json')
  .option('-p, --platform <platform>', 'Platform to crawl (optional)')
  .action(async options => {
    try {
      console.log('🕷️  Starting data crawling...');

      const config = await loadConfig(options.config);
      const pipeline = new ContestPipeline(config);

      const result = await pipeline.execute('crawl-only', options.platform);
      displayResults(result);

      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      logger.error('Crawling failed', { error });
      console.error('❌ Crawling failed:', error);
      process.exit(1);
    }
  });

program
  .command('process')
  .description('Process existing raw data with AI')
  .option('-c, --config <path>', 'Configuration file path', 'config/app.json')
  .action(async options => {
    try {
      console.log('🤖 Starting AI processing...');

      const config = await loadConfig(options.config);
      const pipeline = new ContestPipeline(config);

      const result = await pipeline.execute('process-only');
      displayResults(result);

      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      logger.error('Processing failed', { error });
      console.error('❌ Processing failed:', error);
      process.exit(1);
    }
  });

program
  .command('export')
  .description('Export contest data')
  .option('-c, --config <path>', 'Configuration file path', 'config/app.json')
  .option('-f, --format <format>', 'Export format (json|csv)', 'json')
  .option('-p, --platform <platform>', 'Platform to export (optional)')
  .action(async options => {
    try {
      console.log(
        `📤 Exporting data in ${options.format.toUpperCase()} format...`
      );

      const config = await loadConfig(options.config);
      const pipeline = new ContestPipeline(config);

      const filePath = await pipeline.exportData(
        options.format,
        options.platform
      );

      console.log(`✅ Data exported successfully: ${filePath}`);
    } catch (error) {
      logger.error('Export failed', { error });
      console.error('❌ Export failed:', error);
      process.exit(1);
    }
  });

program
  .command('cleanup')
  .description('Clean up old data files')
  .option('-c, --config <path>', 'Configuration file path', 'config/app.json')
  .option('-d, --days <days>', 'Days to keep (default: 30)', '30')
  .action(async options => {
    try {
      console.log(`🧹 Cleaning up data older than ${options.days} days...`);

      const config = await loadConfig(options.config);
      const pipeline = new ContestPipeline(config);

      await pipeline.cleanup(parseInt(options.days));

      console.log('✅ Cleanup completed successfully');
    } catch (error) {
      logger.error('Cleanup failed', { error });
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  });



// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
