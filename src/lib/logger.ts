/**
 * Structured Logging Utility
 *
 * Production (Cloud Run): Emits structured JSON to stdout, which Cloud Run
 * auto-captures into Google Cloud Logging. Includes OTel trace context for
 * correlation with Cloud Trace spans.
 *
 * Development: Pretty console output with context and metadata.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;

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
 * OTel trace context — disabled.
 * Auto-instrumentations deadlock Firebase Admin SDK outbound calls.
 * See src/instrumentation.ts for details.
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
   * Production: structured JSON to stdout.
   * Cloud Run captures this into Cloud Logging automatically.
   * Cloud Error Reporting auto-detects entries with severity ERROR + @type field.
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

    // Cloud Trace correlation
    if (traceId && PROJECT_ID) {
      entry['logging.googleapis.com/trace'] =
        `projects/${PROJECT_ID}/traces/${traceId}`;
    }
    if (spanId) {
      entry['logging.googleapis.com/spanId'] = spanId;
    }

    // Error details + Cloud Error Reporting @type
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
        entry['@type'] =
          'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent';
      }
    }

    // Single structured JSON line to stdout — Cloud Run ingests this
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
