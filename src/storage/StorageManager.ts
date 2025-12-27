/**
 * Storage Manager
 * Handles data persistence and backup operations
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  ProcessedContest,
  RawContest,
  StorageConfig,
  StorageResult,
} from '../types';
import { logger } from '../utils/logger';
import { generateId } from '../utils';

export class StorageManager {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.ensureDirectories();
  }

  /**
   * Ensure storage directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.ensureDir(this.config.dataDir);
      await fs.ensureDir(path.join(this.config.dataDir, 'raw'));
      await fs.ensureDir(path.join(this.config.dataDir, 'processed'));
      await fs.ensureDir(path.join(this.config.dataDir, 'backup'));
      await fs.ensureDir(path.join(this.config.dataDir, 'archive'));

      logger.info('Storage directories initialized', {
        dataDir: this.config.dataDir,
      });
    } catch (error) {
      logger.error('Failed to initialize storage directories', { error });
      throw error;
    }
  }

  /**
   * Save raw contest data
   */
  async saveRawContests(
    contests: RawContest[],
    platform: string
  ): Promise<StorageResult> {
    try {
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `${platform}-${timestamp}.json`;
      const filePath = path.join(this.config.dataDir, 'raw', filename);

      // Create backup if file exists
      if (await fs.pathExists(filePath)) {
        await this.createBackup(filePath);
      }

      // Save data
      await fs.writeJson(
        filePath,
        {
          platform,
          timestamp: new Date().toISOString(),
          contestCount: contests.length,
          contests,
        },
        { spaces: 2 }
      );

      // Update latest symlink
      const latestPath = path.join(
        this.config.dataDir,
        'raw',
        `${platform}-latest.json`
      );
      if (await fs.pathExists(latestPath)) {
        await fs.remove(latestPath);
      }
      await fs.copy(filePath, latestPath);

      logger.info(`Saved ${contests.length} raw contests for ${platform}`, {
        filePath,
      });

      return {
        success: true,
        filePath,
        message: `Successfully saved ${contests.length} contests`,
        contestCount: contests.length,
      };
    } catch (error) {
      logger.error(`Failed to save raw contests for ${platform}`, { error });
      return {
        success: false,
        message: `Failed to save contests: ${error}`,
      };
    }
  }

  /**
   * Save processed contest data
   */
  async saveProcessedContests(
    contests: ProcessedContest[],
    platform?: string
  ): Promise<StorageResult> {
    try {
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = platform
        ? `${platform}-${timestamp}.json`
        : `all-contests-${timestamp}.json`;
      const filePath = path.join(this.config.dataDir, 'processed', filename);

      // Create backup if file exists
      if (await fs.pathExists(filePath)) {
        await this.createBackup(filePath);
      }

      // Save data with metadata
      const dataToSave = {
        platform: platform || 'all',
        timestamp: new Date().toISOString(),
        contestCount: contests.length,
        contests,
        metadata: {
          version: '1.0.0',
          dataStructure: 'ProcessedContest',
          lastUpdated: new Date().toISOString(),
        },
      };

      await fs.writeJson(filePath, dataToSave, { spaces: 2 });

      // Update latest symlink
      const latestFilename = platform
        ? `${platform}-latest.json`
        : 'all-contests-latest.json';
      const latestPath = path.join(
        this.config.dataDir,
        'processed',
        latestFilename
      );
      if (await fs.pathExists(latestPath)) {
        await fs.remove(latestPath);
      }
      await fs.copy(filePath, latestPath);

      logger.info(`Saved ${contests.length} processed contests`, {
        filePath,
        platform,
      });

      return {
        success: true,
        filePath,
        message: `Successfully saved ${contests.length} processed contests`,
        contestCount: contests.length,
      };
    } catch (error) {
      logger.error('Failed to save processed contests', { error, platform });
      return {
        success: false,
        message: `Failed to save processed contests: ${error}`,
      };
    }
  }

  /**
   * Load raw contest data
   */
  async loadRawContests(
    platform?: string,
    date?: string
  ): Promise<RawContest[]> {
    try {
      let filePath: string;

      if (platform && date) {
        filePath = path.join(
          this.config.dataDir,
          'raw',
          `${platform}-${date}.json`
        );
      } else if (platform) {
        filePath = path.join(
          this.config.dataDir,
          'raw',
          `${platform}-latest.json`
        );
      } else {
        // Load all latest raw data, optionally filtered by platform
        const rawDir = path.join(this.config.dataDir, 'raw');
        
        if (!(await fs.pathExists(rawDir))) {
            return [];
        }

        const files = await fs.readdir(rawDir);
        let latestFiles = files.filter(file => file.endsWith('-latest.json'));

        if (platform) {
            latestFiles = latestFiles.filter(file => file.startsWith(`${platform}-`));
        }

        const allContests: RawContest[] = [];
        for (const file of latestFiles) {
          try {
            const data = await fs.readJson(path.join(rawDir, file));
            if (data.contests && Array.isArray(data.contests)) {
                allContests.push(...data.contests);
            }
          } catch (e) {
             logger.warn(`Failed to read raw file ${file}`, {error: e});
          }
        }
        return allContests;
      }

      if (!(await fs.pathExists(filePath))) {
        logger.warn(`Raw data file not found: ${filePath}`);
        return [];
      }

      const data = await fs.readJson(filePath);
      return data.contests || [];
    } catch (error) {
      logger.error('Failed to load raw contests', { error, platform, date });
      return [];
    }
  }

  /**
   * Load processed contest data
   */
  async loadProcessedContests(
    platform?: string,
    date?: string
  ): Promise<ProcessedContest[]> {
    try {
      let filePath: string;

      if (platform && date) {
        filePath = path.join(
          this.config.dataDir,
          'processed',
          `${platform}-${date}.json`
        );
      } else if (platform) {
        filePath = path.join(
          this.config.dataDir,
          'processed',
          `${platform}-latest.json`
        );
      } else {
        filePath = path.join(
          this.config.dataDir,
          'processed',
          'all-contests-latest.json'
        );
      }

      if (!(await fs.pathExists(filePath))) {
        logger.warn(`Processed data file not found: ${filePath}`);
        return [];
      }

      const data = await fs.readJson(filePath);
      return data.contests || [];
    } catch (error) {
      logger.error('Failed to load processed contests', {
        error,
        platform,
        date,
      });
      return [];
    }
  }

  /**
   * Create backup of existing file
   */
  private async createBackup(filePath: string): Promise<void> {
    try {
      const filename = path.basename(filePath);
      const backupName = `${filename}.${generateId('backup')}.bak`;
      const backupPath = path.join(this.config.dataDir, 'backup', backupName);

      await fs.copy(filePath, backupPath);

      // Clean old backups if needed
      await this.cleanOldBackups();

      logger.debug(`Created backup: ${backupName}`);
    } catch (error) {
      logger.warn('Failed to create backup', { error, filePath });
    }
  }

  /**
   * Clean old backup files
   */
  private async cleanOldBackups(): Promise<void> {
    try {
      const backupDir = path.join(this.config.dataDir, 'backup');
      const files = await fs.readdir(backupDir);

      if (files.length > this.config.backupCount) {
        // Sort by creation time and remove oldest
        const fileStats = await Promise.all(
          files.map(async file => {
            const filePath = path.join(backupDir, file);
            const stats = await fs.stat(filePath);
            return { file, mtime: stats.mtime };
          })
        );

        fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

        const filesToDelete = fileStats.slice(
          0,
          files.length - this.config.backupCount
        );

        for (const { file } of filesToDelete) {
          await fs.remove(path.join(backupDir, file));
          logger.debug(`Removed old backup: ${file}`);
        }
      }
    } catch (error) {
      logger.warn('Failed to clean old backups', { error });
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<Record<string, unknown>> {
    try {
      const stats = {
        rawFiles: 0,
        processedFiles: 0,
        backupFiles: 0,
        totalSize: 0,
        lastUpdate: null as string | null,
        platforms: [] as string[],
      };

      // Count raw files
      const rawDir = path.join(this.config.dataDir, 'raw');
      if (await fs.pathExists(rawDir)) {
        const rawFiles = await fs.readdir(rawDir);
        stats.rawFiles = rawFiles.length;

        // Extract platforms from filenames
        const platforms = new Set<string>();
        rawFiles.forEach(file => {
          const match = file.match(
            /^(.+?)-(?:latest|\d{4}-\d{2}-\d{2})\.json$/
          );
          if (match) {
            platforms.add(match[1]);
          }
        });
        stats.platforms = Array.from(platforms);
      }

      // Count processed files
      const processedDir = path.join(this.config.dataDir, 'processed');
      if (await fs.pathExists(processedDir)) {
        const processedFiles = await fs.readdir(processedDir);
        stats.processedFiles = processedFiles.length;
      }

      // Count backup files
      const backupDir = path.join(this.config.dataDir, 'backup');
      if (await fs.pathExists(backupDir)) {
        const backupFiles = await fs.readdir(backupDir);
        stats.backupFiles = backupFiles.length;
      }

      // Calculate total size
      const calculateDirSize = async (dirPath: string): Promise<number> => {
        if (!(await fs.pathExists(dirPath))) return 0;

        let size = 0;
        const files = await fs.readdir(dirPath);

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stat = await fs.stat(filePath);
          size += stat.size;
        }

        return size;
      };

      stats.totalSize =
        (await calculateDirSize(rawDir)) +
        (await calculateDirSize(processedDir)) +
        (await calculateDirSize(backupDir));

      // Get last update time
      const latestFile = path.join(processedDir, 'all-contests-latest.json');
      if (await fs.pathExists(latestFile)) {
        const stat = await fs.stat(latestFile);
        stats.lastUpdate = stat.mtime.toISOString();
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get storage statistics', { error });
      return {};
    }
  }

  /**
   * Export data to different formats
   */
  async exportData(format: 'json' | 'csv', platform?: string): Promise<string> {
    const contests = await this.loadProcessedContests(platform);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `export-${platform || 'all'}-${timestamp}.${format}`;
    const filePath = path.join(this.config.dataDir, filename);

    if (format === 'json') {
      await fs.writeJson(filePath, contests, { spaces: 2 });
    } else if (format === 'csv') {
      // Simple CSV export
      const csvHeader =
        'Title,Platform,URL,Status,Deadline,Prize,Description\n';
      const csvRows = contests
        .map(contest =>
          [
            `"${(contest.title || '').replace(/"/g, '""')}"`,
            `"${contest.platform}"`,
            `"${contest.url}"`,
            `"${contest.status}"`,
            `"${contest.deadline || ''}"`,
            `"${(contest.prize || '').replace(/"/g, '""')}"`,
            `"${(contest.description || '').replace(/"/g, '""').substring(0, 100)}..."`,
          ].join(',')
        )
        .join('\n');

      await fs.writeFile(filePath, csvHeader + csvRows, 'utf-8');
    }

    logger.info(
      `Exported ${contests.length} contests to ${format.toUpperCase()}`,
      { filePath }
    );
    return filePath;
  }

  /**
   * Clean up old data files
   */
  async cleanup(daysToKeep = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const directories = ['raw', 'processed'];

    for (const dir of directories) {
      const dirPath = path.join(this.config.dataDir, dir);

      if (!(await fs.pathExists(dirPath))) continue;

      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (file.endsWith('-latest.json')) continue; // Skip latest files

        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.remove(filePath);
          logger.info(`Cleaned up old file: ${file}`);
        }
      }
    }
  }

  /**
   * Archive ended contests that are older than specified days
   * Moves them from processed to archive directory
   */
  async archiveEndedContests(archiveDays = 30): Promise<StorageResult> {
    try {
      const archiveDir = path.join(this.config.dataDir, 'archive');
      
      // Load all processed contests
      const allContests = await this.loadProcessedContests();
      
      if (allContests.length === 0) {
        return {
          success: true,
          message: 'No contests to archive',
          contestCount: 0,
        };
      }

      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - archiveDays);

      // Separate active and archivable contests
      const activeContests: ProcessedContest[] = [];
      const contestsToArchive: ProcessedContest[] = [];

      for (const contest of allContests) {
        const shouldArchive = 
          contest.status === 'ended' &&
          contest.deadline &&
          new Date(contest.deadline) < cutoffDate;
        
        if (shouldArchive) {
          contestsToArchive.push(contest);
        } else {
          activeContests.push(contest);
        }
      }

      if (contestsToArchive.length === 0) {
        logger.info('No contests eligible for archiving');
        return {
          success: true,
          message: 'No contests eligible for archiving',
          contestCount: 0,
        };
      }

      // Load existing archive or create new
      const archiveFilename = `archive-${now.toISOString().split('T')[0]}.json`;
      const archiveFilePath = path.join(archiveDir, archiveFilename);
      
      let existingArchive: ProcessedContest[] = [];
      if (await fs.pathExists(archiveFilePath)) {
        const archiveData = await fs.readJson(archiveFilePath);
        existingArchive = archiveData.contests || [];
      }

      // Merge with existing archive (avoid duplicates by ID)
      const existingIds = new Set(existingArchive.map(c => c.id));
      const newArchiveEntries = contestsToArchive.filter(c => !existingIds.has(c.id));
      const mergedArchive = [...existingArchive, ...newArchiveEntries];

      // Save updated archive
      await fs.writeJson(
        archiveFilePath,
        {
          timestamp: now.toISOString(),
          contestCount: mergedArchive.length,
          contests: mergedArchive,
        },
        { spaces: 2 }
      );

      // Update the processed file with only active contests
      if (activeContests.length > 0) {
        await this.saveProcessedContests(activeContests);
      }

      logger.info(`Archived ${newArchiveEntries.length} ended contests`, {
        archiveFile: archiveFilename,
        remainingActive: activeContests.length,
      });

      return {
        success: true,
        filePath: archiveFilePath,
        message: `Archived ${newArchiveEntries.length} contests`,
        contestCount: newArchiveEntries.length,
      };
    } catch (error) {
      logger.error('Failed to archive contests', { error });
      return {
        success: false,
        message: `Failed to archive contests: ${error}`,
      };
    }
  }

  /**
   * Load archived contests
   */
  async loadArchivedContests(date?: string): Promise<ProcessedContest[]> {
    try {
      const archiveDir = path.join(this.config.dataDir, 'archive');
      
      if (!(await fs.pathExists(archiveDir))) {
        return [];
      }

      if (date) {
        const archivePath = path.join(archiveDir, `archive-${date}.json`);
        if (await fs.pathExists(archivePath)) {
          const data = await fs.readJson(archivePath);
          return data.contests || [];
        }
        return [];
      }

      // Load all archives
      const files = await fs.readdir(archiveDir);
      const archiveFiles = files.filter(f => f.startsWith('archive-') && f.endsWith('.json'));
      
      const allArchived: ProcessedContest[] = [];
      for (const file of archiveFiles) {
        try {
          const data = await fs.readJson(path.join(archiveDir, file));
          if (data.contests && Array.isArray(data.contests)) {
            allArchived.push(...data.contests);
          }
        } catch (e) {
          logger.warn(`Failed to read archive file ${file}`, { error: e });
        }
      }

      return allArchived;
    } catch (error) {
      logger.error('Failed to load archived contests', { error });
      return [];
    }
  }
}
