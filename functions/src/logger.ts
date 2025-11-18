/**
 * Structured Logger for Cloud Logging
 *
 * Emits JSON-structured logs compatible with Google Cloud Logging best practices.
 * Supports severity levels, trace context, custom labels, and error tracking.
 *
 * Reference: 000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md
 * Reference: 000-docs/239-OD-GUID-logging-standard.md (to be created)
 */

/**
 * Log severity levels compatible with Cloud Logging
 */
export enum LogSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  NOTICE = 'NOTICE',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  ALERT = 'ALERT',
  EMERGENCY = 'EMERGENCY',
}

/**
 * Custom labels for log correlation and filtering
 */
export interface LogLabels {
  /**
   * Component generating the log (web-app, agent, pipeline)
   */
  component: 'web-app' | 'cloud-function' | 'agent' | 'pipeline';

  /**
   * Environment context
   */
  environment?: 'production' | 'staging' | 'development';

  /**
   * User ID for user-scoped logs
   */
  userId?: string;

  /**
   * Request ID for request tracing
   */
  requestId?: string;

  /**
   * Agent ID for Vertex AI agent logs
   */
  agentId?: string;

  /**
   * Workspace ID for multi-tenant context
   */
  workspaceId?: string;

  /**
   * Additional custom labels (allows any type for flexibility)
   */
  [key: string]: any;
}

/**
 * HTTP request metadata for API logs
 */
export interface HttpRequestMetadata {
  requestMethod?: string;
  requestUrl?: string;
  status?: number;
  userAgent?: string;
  remoteIp?: string;
  referer?: string;
  latency?: string; // Format: "0.234s"
  protocol?: string;
}

/**
 * Error metadata for structured error logging
 */
export interface ErrorMetadata {
  code?: string;
  message: string;
  stack?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * Trace context for distributed tracing correlation
 */
export interface TraceContext {
  /**
   * Full trace ID path: projects/PROJECT_ID/traces/TRACE_ID
   */
  trace?: string;

  /**
   * Span ID for current operation
   */
  spanId?: string;

  /**
   * Whether trace should be sampled for Cloud Trace
   */
  traceSampled?: boolean;
}

/**
 * Complete structured log entry
 */
export interface StructuredLogEntry extends TraceContext {
  severity: LogSeverity;
  message: string;
  timestamp?: string; // ISO 8601 format
  labels?: LogLabels;
  httpRequest?: HttpRequestMetadata;
  error?: ErrorMetadata;
  /**
   * Additional structured data
   */
  data?: Record<string, any>;
}

/**
 * Structured Logger Class
 *
 * Usage:
 * ```typescript
 * import { Logger } from './logger';
 *
 * const logger = new Logger({ component: 'cloud-function' });
 *
 * logger.info('Processing request', { userId: 'user_123', requestId: 'req_abc' });
 * logger.error('Failed to create user', error, { userId: 'user_123' });
 * ```
 */
export class Logger {
  private defaultLabels: LogLabels;
  private projectId: string;

  constructor(defaultLabels: Partial<LogLabels> = {}) {
    this.defaultLabels = {
      component: defaultLabels.component || 'cloud-function',
      environment: (process.env.NODE_ENV as any) || 'development',
      ...defaultLabels,
    };
    this.projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
  }

  /**
   * Extract trace context from Cloud Functions context or HTTP request
   */
  private extractTraceContext(traceHeader?: string): TraceContext {
    if (!traceHeader || !this.projectId) {
      return {};
    }

    // Parse W3C Trace Context format: "traceparent: 00-TRACE_ID-SPAN_ID-FLAGS"
    // Or Google Cloud format: "X-Cloud-Trace-Context: TRACE_ID/SPAN_ID;o=TRACE_TRUE"
    const googleFormat = traceHeader.match(/^([0-9a-f]+)\/(\d+);o=(\d)$/);
    if (googleFormat) {
      const [, traceId, spanId, sampled] = googleFormat;
      return {
        trace: `projects/${this.projectId}/traces/${traceId}`,
        spanId,
        traceSampled: sampled === '1',
      };
    }

    // W3C Trace Context format
    const w3cFormat = traceHeader.match(/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/);
    if (w3cFormat) {
      const [, traceId, spanId, flags] = w3cFormat;
      return {
        trace: `projects/${this.projectId}/traces/${traceId}`,
        spanId,
        traceSampled: (parseInt(flags, 16) & 1) === 1,
      };
    }

    return {};
  }

  /**
   * Emit a structured log entry to Cloud Logging (stdout)
   */
  private emit(entry: StructuredLogEntry): void {
    const logEntry: StructuredLogEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      labels: {
        ...this.defaultLabels,
        ...entry.labels,
      },
    };

    // Cloud Logging reads structured JSON from stdout
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, data?: Record<string, any>, labels?: Partial<LogLabels>): void {
    this.emit({
      severity: LogSeverity.DEBUG,
      message,
      data,
      labels: labels as LogLabels,
    });
  }

  /**
   * Log at INFO level (default for normal operations)
   */
  info(message: string, data?: Record<string, any>, labels?: Partial<LogLabels>): void {
    this.emit({
      severity: LogSeverity.INFO,
      message,
      data,
      labels: labels as LogLabels,
    });
  }

  /**
   * Log at WARNING level (potential issues)
   */
  warn(message: string, data?: Record<string, any>, labels?: Partial<LogLabels>): void {
    this.emit({
      severity: LogSeverity.WARNING,
      message,
      data,
      labels: labels as LogLabels,
    });
  }

  /**
   * Log at ERROR level (operation failed, but service continues)
   */
  error(message: string, error?: Error | unknown, labels?: Partial<LogLabels>): void {
    const errorMetadata: ErrorMetadata | undefined = error
      ? {
          code: (error as any).code || 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }
      : undefined;

    this.emit({
      severity: LogSeverity.ERROR,
      message,
      error: errorMetadata,
      labels: labels as LogLabels,
    });
  }

  /**
   * Log at CRITICAL level (service degraded or unavailable)
   */
  critical(message: string, error?: Error | unknown, labels?: Partial<LogLabels>): void {
    const errorMetadata: ErrorMetadata | undefined = error
      ? {
          code: (error as any).code || 'CRITICAL_ERROR',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }
      : undefined;

    this.emit({
      severity: LogSeverity.CRITICAL,
      message,
      error: errorMetadata,
      labels: labels as LogLabels,
    });
  }

  /**
   * Log HTTP request with automatic metadata extraction
   */
  httpRequest(
    message: string,
    request: {
      method?: string;
      url?: string;
      status?: number;
      latency?: number; // milliseconds
      userAgent?: string;
      remoteIp?: string;
      traceHeader?: string;
    },
    labels?: Partial<LogLabels>
  ): void {
    const traceContext = this.extractTraceContext(request.traceHeader);

    this.emit({
      severity: request.status && request.status >= 400 ? LogSeverity.ERROR : LogSeverity.INFO,
      message,
      ...traceContext,
      httpRequest: {
        requestMethod: request.method,
        requestUrl: request.url,
        status: request.status,
        userAgent: request.userAgent,
        remoteIp: request.remoteIp,
        latency: request.latency ? `${(request.latency / 1000).toFixed(3)}s` : undefined,
      },
      labels: labels as LogLabels,
    });
  }

  /**
   * Create a child logger with additional default labels
   */
  child(additionalLabels: Partial<LogLabels>): Logger {
    return new Logger({
      ...this.defaultLabels,
      ...additionalLabels,
    });
  }

  /**
   * Log Cloud Functions execution start
   */
  functionStart(functionName: string, labels?: Partial<LogLabels>): void {
    this.info(`Cloud Function started: ${functionName}`, undefined, labels);
  }

  /**
   * Log Cloud Functions execution end with duration
   */
  functionEnd(functionName: string, startTime: number, labels?: Partial<LogLabels>): void {
    const duration = Date.now() - startTime;
    this.info(`Cloud Function completed: ${functionName}`, { durationMs: duration }, labels);
  }

  /**
   * Log Vertex AI agent request
   */
  agentRequest(
    agentId: string,
    taskType: string,
    data?: Record<string, any>,
    labels?: Partial<LogLabels>
  ): void {
    this.info(`Agent request: ${agentId}`, { taskType, ...data }, { agentId, ...labels });
  }

  /**
   * Log Vertex AI agent response
   */
  agentResponse(
    agentId: string,
    taskType: string,
    success: boolean,
    durationMs: number,
    labels?: Partial<LogLabels>
  ): void {
    const severity = success ? LogSeverity.INFO : LogSeverity.ERROR;
    this.emit({
      severity,
      message: `Agent response: ${agentId}`,
      data: { taskType, success, durationMs },
      labels: { agentId, ...labels } as LogLabels,
    });
  }
}

/**
 * Default logger instance for simple use cases
 */
export const logger = new Logger({ component: 'cloud-function' });

/**
 * Create a logger with custom default labels
 */
export function createLogger(labels: Partial<LogLabels>): Logger {
  return new Logger(labels);
}
