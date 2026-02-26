export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import(
      '@opentelemetry/auto-instrumentations-node'
    );

    const isProduction = process.env.NODE_ENV === 'production';

    let traceExporter: InstanceType<
      typeof import('@google-cloud/opentelemetry-cloud-trace-exporter').TraceExporter
    > | undefined;

    if (isProduction) {
      const { TraceExporter } = await import(
        '@google-cloud/opentelemetry-cloud-trace-exporter'
      );
      traceExporter = new TraceExporter();
    }

    const sdk = new NodeSDK({
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable instrumentations that cause deadlocks with Firebase Admin SDK
          // HTTP instrumentation wraps outgoing REST calls (verifyIdToken, etc.)
          // and creates circular dependency with Cloud Trace gRPC exporter
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-http': { enabled: false },
          '@opentelemetry/instrumentation-dns': { enabled: false },
          '@opentelemetry/instrumentation-net': { enabled: false },
        }),
      ],
      serviceName: 'hustle-app',
    });

    sdk.start();
  }
}
