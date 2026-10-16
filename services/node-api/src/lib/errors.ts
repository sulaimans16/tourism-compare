import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, 'NOT_FOUND', `${what} not found`);
export const unauthorized = () => new HttpError(401, 'UNAUTHORIZED', 'Sign in required');

export function errorHandler(err: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) {
  if (err instanceof HttpError) {
    return reply.status(err.status).send({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    return reply
      .status(400)
      .send({ error: { code: 'BAD_REQUEST', message: 'Invalid request', details: err.flatten() } });
  }
  const status = (err as FastifyError).statusCode;
  if (status && status < 500) {
    return reply.status(status).send({ error: { code: (err as FastifyError).code ?? 'BAD_REQUEST', message: err.message } });
  }
  req.log.error(err);
  return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
}
