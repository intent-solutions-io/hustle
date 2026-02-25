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
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
      serviceName: 'hustle-app',
    });

    sdk.start();
  }
}
