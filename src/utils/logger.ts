/**
 * Simple logging utility for AI Contests Navigator
 * Provides structured logging with different levels
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  private level: LogLevel;
  private logFile?: string;
  private enableConsole: boolean;

  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(
    level: LogLevel = 'info',
    logFile?: string,
    enableConsole = true
  ) {
    this.level = level;
    this.logFile = logFile;
    this.enableConsole = enableConsole;

    if (this.logFile) {
      this.ensureLogDir();
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | Record<string, any>): void {
    let context: Record<string, any> | undefined;

    if (error instanceof Error) {
      context = {
        error: error.message,
        stack: error.stack,
      };
    } else if (error) {
      context = error;
    }

    this.log('error', message, context);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): void {
    if (this.levels[level] < this.levels[this.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // Console output
    if (this.enableConsole) {
      this.logToConsole(entry);
    }

    // File output
    if (this.logFile) {
      this.logToFile(entry);
    }
  }

  /**
   * Output to console with colors
   */
  private logToConsole(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level];

    const timestamp = entry.timestamp.substring(11, 19); // HH:MM:SS
    const levelStr = entry.level.toUpperCase().padEnd(5);

    let logMessage = `${color}${timestamp} ${levelStr}${reset} ${entry.message}`;

    if (entry.context) {
      logMessage += `\n${JSON.stringify(entry.context, null, 2)}`;
    }

    switch (entry.level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'debug':
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Output to file
   */
  private logToFile(entry: LogEntry): void {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile!, logLine, 'utf-8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDir(): void {
    if (!this.logFile) return;

    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Create child logger with context
   */
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger(
      this.level,
      this.logFile,
      this.enableConsole
    );

    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    (childLogger as any).log = (
      level: LogLevel,
      message: string,
      additionalContext?: Record<string, any>
    ) => {
      const mergedContext = { ...context, ...additionalContext };
      originalLog(level, message, mergedContext);
    };

    return childLogger;
  }
}

// Default logger instance
export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || 'info',
  process.env.LOG_FILE || './logs/app.log',
  process.env.NODE_ENV !== 'test'
);
