/**
 * Test suite for SourceManager
 */

import { SourceManager } from '../src/sources/SourceManager';
import { PlatformConfig } from '../src/types';
import * as fs from 'fs-extra';

// Mock fs-extra
jest.mock('fs-extra');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('SourceManager', () => {
  let sourceManager: SourceManager;
  const testConfigPath = 'test-config.json';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    sourceManager = new SourceManager(testConfigPath);
  });

  describe('constructor', () => {
    it('should initialize with config path', () => {
      expect(sourceManager).toBeInstanceOf(SourceManager);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid platform config', () => {
      const validConfig: PlatformConfig = {
        name: 'test-platform',
        displayName: 'Test Platform',
        baseUrl: 'https://example.com',
        contestListUrl: 'https://example.com/contests',
        selectors: {
          contestItems: '.contest',
          title: '.title',
          link: 'a[href]'
        },
        enabled: true,
        delay: 1.0,
        maxRetries: 3
      };

      const errors = sourceManager.validateConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid config', () => {
      const invalidConfig: Partial<PlatformConfig> = {
        name: '',
        baseUrl: 'invalid-url',
      };

      const errors = sourceManager.validateConfig(invalidConfig as PlatformConfig);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Platform name cannot be empty');
    });
  });

  describe('generateCrawlTasks', () => {
    it('should generate tasks for enabled platforms', () => {
      // Mock platform data
      const mockPlatform: PlatformConfig = {
        name: 'test-platform',
        displayName: 'Test Platform',
        baseUrl: 'https://example.com',
        contestListUrl: 'https://example.com/contests',
        selectors: {
          contestItems: '.contest',
          title: '.title',
          link: 'a[href]'
        },
        enabled: true,
        delay: 1.0,
        maxRetries: 3
      };

      // Mock the platforms map
      (sourceManager as any).platforms = new Map([['test-platform', mockPlatform]]);

      const tasks = sourceManager.generateCrawlTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].platformName).toBe('test-platform');
      expect(tasks[0].url).toBe('https://example.com/contests');
    });

    it('should filter tasks by platform names', () => {
      const mockPlatform1: PlatformConfig = {
        name: 'platform1',
        displayName: 'Platform 1',
        baseUrl: 'https://example1.com',
        contestListUrl: 'https://example1.com/contests',
        selectors: { contestItems: '.contest', title: '.title', link: 'a' },
        enabled: true,
        delay: 1.0,
        maxRetries: 3
      };

      const mockPlatform2: PlatformConfig = {
        name: 'platform2',
        displayName: 'Platform 2',
        baseUrl: 'https://example2.com',
        contestListUrl: 'https://example2.com/contests',
        selectors: { contestItems: '.contest', title: '.title', link: 'a' },
        enabled: true,
        delay: 1.0,
        maxRetries: 3
      };

      (sourceManager as any).platforms = new Map([
        ['platform1', mockPlatform1],
        ['platform2', mockPlatform2]
      ]);

      const tasks = sourceManager.generateCrawlTasks(['platform1']);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].platformName).toBe('platform1');
    });
  });
});
