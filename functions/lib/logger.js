"use strict";
/**
 * Structured Logger for Cloud Logging
 *
 * Emits JSON-structured logs compatible with Google Cloud Logging best practices.
 * Supports severity levels, trace context, custom labels, and error tracking.
 *
 * Reference: 000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md
 * Reference: 000-docs/239-OD-GUID-logging-standard.md (to be created)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogSeverity = void 0;
exports.createLogger = createLogger;
/**
 * Log severity levels compatible with Cloud Logging
 */
var LogSeverity;
(function (LogSeverity) {
    LogSeverity["DEBUG"] = "DEBUG";
    LogSeverity["INFO"] = "INFO";
    LogSeverity["NOTICE"] = "NOTICE";
    LogSeverity["WARNING"] = "WARNING";
    LogSeverity["ERROR"] = "ERROR";
    LogSeverity["CRITICAL"] = "CRITICAL";
    LogSeverity["ALERT"] = "ALERT";
    LogSeverity["EMERGENCY"] = "EMERGENCY";
})(LogSeverity || (exports.LogSeverity = LogSeverity = {}));
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
class Logger {
    constructor(defaultLabels = {}) {
        this.defaultLabels = {
            component: defaultLabels.component || 'cloud-function',
            environment: process.env.NODE_ENV || 'development',
            ...defaultLabels,
        };
        this.projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
    }
    /**
     * Extract trace context from Cloud Functions context or HTTP request
     */
    extractTraceContext(traceHeader) {
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
    emit(entry) {
        const logEntry = {
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
    debug(message, data, labels) {
        this.emit({
            severity: LogSeverity.DEBUG,
            message,
            data,
            labels: labels,
        });
    }
    /**
     * Log at INFO level (default for normal operations)
     */
    info(message, data, labels) {
        this.emit({
            severity: LogSeverity.INFO,
            message,
            data,
            labels: labels,
        });
    }
    /**
     * Log at WARNING level (potential issues)
     */
    warn(message, data, labels) {
        this.emit({
            severity: LogSeverity.WARNING,
            message,
            data,
            labels: labels,
        });
    }
    /**
     * Log at ERROR level (operation failed, but service continues)
     */
    error(message, error, labels) {
        const errorMetadata = error
            ? {
                code: error.code || 'UNKNOWN_ERROR',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            }
            : undefined;
        this.emit({
            severity: LogSeverity.ERROR,
            message,
            error: errorMetadata,
            labels: labels,
        });
    }
    /**
     * Log at CRITICAL level (service degraded or unavailable)
     */
    critical(message, error, labels) {
        const errorMetadata = error
            ? {
                code: error.code || 'CRITICAL_ERROR',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            }
            : undefined;
        this.emit({
            severity: LogSeverity.CRITICAL,
            message,
            error: errorMetadata,
            labels: labels,
        });
    }
    /**
     * Log HTTP request with automatic metadata extraction
     */
    httpRequest(message, request, labels) {
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
            labels: labels,
        });
    }
    /**
     * Create a child logger with additional default labels
     */
    child(additionalLabels) {
        return new Logger({
            ...this.defaultLabels,
            ...additionalLabels,
        });
    }
    /**
     * Log Cloud Functions execution start
     */
    functionStart(functionName, labels) {
        this.info(`Cloud Function started: ${functionName}`, undefined, labels);
    }
    /**
     * Log Cloud Functions execution end with duration
     */
    functionEnd(functionName, startTime, labels) {
        const duration = Date.now() - startTime;
        this.info(`Cloud Function completed: ${functionName}`, { durationMs: duration }, labels);
    }
    /**
     * Log Vertex AI agent request
     */
    agentRequest(agentId, taskType, data, labels) {
        this.info(`Agent request: ${agentId}`, { taskType, ...data }, { agentId, ...labels });
    }
    /**
     * Log Vertex AI agent response
     */
    agentResponse(agentId, taskType, success, durationMs, labels) {
        const severity = success ? LogSeverity.INFO : LogSeverity.ERROR;
        this.emit({
            severity,
            message: `Agent response: ${agentId}`,
            data: { taskType, success, durationMs },
            labels: { agentId, ...labels },
        });
    }
}
exports.Logger = Logger;
/**
 * Default logger instance for simple use cases
 */
exports.logger = new Logger({ component: 'cloud-function' });
/**
 * Create a logger with custom default labels
 */
function createLogger(labels) {
    return new Logger(labels);
}
//# sourceMappingURL=logger.js.map