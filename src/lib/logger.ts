/**
 * Structured Logging Utility
 * Integrates with Google Cloud Logging for production
 * Falls back to console in development
 */
import { Logging } from '@google-cloud/logging';
import { ErrorReporting } from '@google-cloud/error-reporting';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;

// Initialize Google Cloud clients (only in production with credentials)
let cloudLogging: Logging | null = null;
let errorReporting: ErrorReporting | null = null;

if (IS_PRODUCTION && PROJECT_ID) {
  try {
    cloudLogging = new Logging({ projectId: PROJECT_ID });
    errorReporting = new ErrorReporting({
      projectId: PROJECT_ID,
      reportMode: 'production',
    });
  } catch (error) {
    console.warn('Failed to initialize Google Cloud Logging:', error);
  }
}

const log = cloudLogging?.log('hustle-app');

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

interface LogMetadata {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Structured logger with Cloud Logging integration
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: LogMetadata) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: LogMetadata) {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a warning
   */
  warn(message: string, metadata?: LogMetadata) {
    this.log(LogLevel.WARNING, message, metadata);
  }

  /**
   * Log an error
   */
  error(message: string, error?: Error, metadata?: LogMetadata) {
    this.log(LogLevel.ERROR, message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });

    // Report to Google Cloud Error Reporting
    if (errorReporting && error) {
      errorReporting.report(error);
    }
  }

  /**
   * Log a critical error
   */
  critical(message: string, error?: Error, metadata?: LogMetadata) {
    this.log(LogLevel.CRITICAL, message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });

    // Report to Google Cloud Error Reporting
    if (errorReporting && error) {
      errorReporting.report(error);
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
    const logEntry = {
      severity: level,
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    if (IS_PRODUCTION && log) {
      // Send to Google Cloud Logging
      const entry = log.entry(
        {
          severity: level,
          resource: {
            type: 'cloud_run_revision',
            labels: {
              project_id: PROJECT_ID || '',
              service_name: 'hustle-app',
            },
          },
        },
        logEntry
      );

      log.write(entry).catch((err) => {
        console.error('Failed to write to Cloud Logging:', err);
        this.fallbackLog(level, message, metadata);
      });
    } else {
      // Development: use console
      this.fallbackLog(level, message, metadata);
    }
  }

  /**
   * Fallback to console logging
   */
  private fallbackLog(level: LogLevel, message: string, metadata?: LogMetadata) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, metadata || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, metadata || '');
        break;
      case LogLevel.WARNING:
        console.warn(logMessage, metadata || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logMessage, metadata || '');
        break;
    }
  }
}

/**
 * Create a logger for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = new Logger('app');
