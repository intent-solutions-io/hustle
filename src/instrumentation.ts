/**
 * OpenTelemetry Instrumentation — DISABLED
 *
 * Auto-instrumentations (http, undici, grpc, dns, net, fs) deadlock
 * Firebase Admin SDK outbound calls against the Cloud Trace gRPC exporter.
 * Disabling individual instrumentations is insufficient — the module patching
 * happens on import before config is applied, poisoning the instance.
 *
 * TODO: Re-enable with explicit (non-auto) instrumentations once the
 * deadlock root cause in @opentelemetry/auto-instrumentations-node is resolved.
 * Track: https://github.com/open-telemetry/opentelemetry-js-contrib/issues
 */
export async function register() {
  // OTel disabled — see comment above
}
