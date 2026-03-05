/**
 * Next.js Instrumentation — OTel disabled.
 *
 * Auto-instrumentations (http, undici, grpc, dns, net, fs) deadlock
 * Firebase Admin SDK outbound calls. OTel packages have been removed.
 */
export async function register() {}
