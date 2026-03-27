import type { FastifyRequest, FastifyReply } from 'fastify';

const OPERATION_MAP: Record<string, string> = {
  'POST /v1/data/store': 'store',
  'GET /v1/data/': 'fetch',
  'DELETE /v1/data/': 'delete',
  'POST /v1/ai/analyze': 'analyze',
};

function resolveOperation(method: string, url: string): string | null {
  // Exact match first
  const exact = OPERATION_MAP[`${method} ${url}`];
  if (exact) return exact;

  // Prefix match for parameterized routes
  for (const [pattern, op] of Object.entries(OPERATION_MAP)) {
    const [m, path] = pattern.split(' ');
    if (m === method && url.startsWith(path)) return op;
  }

  return null;
}

export async function auditLogHook(request: FastifyRequest, reply: FastifyReply) {
  const operation = resolveOperation(request.method, request.url);
  if (!operation) return; // Don't audit health checks, usage, etc.

  const body = request.body as Record<string, unknown> | undefined;

  const entry = {
    timestamp: Date.now(),
    operation,
    customerId: request.customer?.customerId ?? 'unknown',
    userId: (body?.userId as string) ?? undefined,
    statusCode: reply.statusCode,
    result: reply.statusCode < 400 ? 'success' : 'error',
    responseTime: Math.round(reply.elapsedTime),
    ip: request.ip,
  };

  // HIPAA: never log encryptedData, ciphertext, or any body content
  request.log.info(entry, 'audit');
}
