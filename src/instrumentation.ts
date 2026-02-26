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
          // DISABLE ALL network/IO instrumentations to prevent deadlocks.
          // Auto-instrumentations wrap outgoing calls (HTTP, undici/fetch, gRPC)
          // creating circular dependencies with the Cloud Trace gRPC exporter.
          // Only keep Express/Fastify for request-level spans.
          '@opentelemetry/instrumentation-http': { enabled: false },
          '@opentelemetry/instrumentation-undici': { enabled: false },
          '@opentelemetry/instrumentation-grpc': { enabled: false },
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-dns': { enabled: false },
          '@opentelemetry/instrumentation-net': { enabled: false },
        }),
      ],
      serviceName: 'hustle-app',
    });

    sdk.start();
  }
}
