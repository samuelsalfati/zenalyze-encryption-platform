import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceError } from '../services/storage.service';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Known service errors (not found, forbidden, etc.)
  if (error instanceof ServiceError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  // Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: error.message,
      statusCode: 400,
      details: { validation: error.validation },
    });
  }

  // Unexpected errors — log details server-side, return generic message to client
  request.log.error(error, 'unhandled error');

  return reply.status(500).send({
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    statusCode: 500,
  });
}
