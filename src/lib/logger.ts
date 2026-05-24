/**
 * Structured Logging Utility
 *
 * Production: Emits structured JSON to stdout. The container runtime
 * (Docker on the VPS) captures stdout into the container log stream;
 * downstream collectors can parse the JSON shape if needed.
 *
 * Development: Pretty console output with context and metadata.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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
 * OTel trace context — currently disabled (no tracer wired in).
 * Returns empty so callers can opt in later without touching the logger.
 */
function getTraceContext(): { traceId?: string; spanId?: string } {
  return {};
}

/**
 * Structured logger with Cloud Run native JSON logging + OTel trace context.
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, metadata?: LogMetadata) {
    this.writeLog(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: LogMetadata) {
    this.writeLog(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    this.writeLog(LogLevel.WARNING, message, metadata);
  }

  error(message: string, error?: Error, metadata?: LogMetadata) {
    this.writeLog(LogLevel.ERROR, message, metadata, error);
  }

  critical(message: string, error?: Error, metadata?: LogMetadata) {
    this.writeLog(LogLevel.CRITICAL, message, metadata, error);
  }

  private writeLog(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    error?: Error
  ) {
    if (IS_PRODUCTION) {
      this.writeStructuredJson(level, message, metadata, error);
    } else {
      this.writeConsole(level, message, metadata, error);
    }
  }

  /**
   * Production: structured JSON to stdout. Container log driver captures it.
   */
  private writeStructuredJson(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    error?: Error
  ) {
    const { traceId, spanId } = getTraceContext();

    const entry: Record<string, unknown> = {
      severity: level,
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    if (traceId) entry.traceId = traceId;
    if (spanId) entry.spanId = spanId;

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const output = JSON.stringify(entry);
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }

  /**
   * Development: pretty console output.
   */
  private writeConsole(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    error?: Error
  ) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;

    const args: unknown[] = [`${prefix} ${message}`];
    if (metadata && Object.keys(metadata).length > 0) args.push(metadata);
    if (error) args.push(error);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(...args);
        break;
      case LogLevel.INFO:
        console.info(...args);
        break;
      case LogLevel.WARNING:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(...args);
        break;
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export const logger = new Logger('app');
