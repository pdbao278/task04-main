import { describe, it, expect } from 'vitest';
import { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, TooManyRequestsError } from '../../src/utils/errors';

describe('AppError', () => {
  it('should create error with status code', () => {
    const err = new AppError('test', 500);
    expect(err.message).toBe('test');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });

  it('should support non-operational errors', () => {
    const err = new AppError('fatal', 500, false);
    expect(err.isOperational).toBe(false);
  });

  it('should be instance of Error', () => {
    const err = new AppError('test', 400);
    expect(err instanceof Error).toBe(true);
    expect(err instanceof AppError).toBe(true);
  });
});

describe('Error subclasses', () => {
  it('BadRequestError → 400', () => {
    const err = new BadRequestError('bad');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad');
  });

  it('BadRequestError default message', () => {
    const err = new BadRequestError();
    expect(err.message).toBe('Bad Request');
  });

  it('UnauthorizedError → 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  it('ForbiddenError → 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it('NotFoundError → 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it('ConflictError → 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });

  it('TooManyRequestsError → 429', () => {
    const err = new TooManyRequestsError();
    expect(err.statusCode).toBe(429);
  });
});
