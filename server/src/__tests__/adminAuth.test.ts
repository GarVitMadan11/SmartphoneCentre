import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminAuth, AuthenticatedRequest } from '../middleware/adminAuth';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

describe('Admin Authentication Middleware', () => {
  const mockSecret = 'test-jwt-secret-for-unit-tests-only';

  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', mockSecret);
  });

  const createMockReq = (authHeader?: string): Partial<AuthenticatedRequest> => ({
    headers: authHeader ? { authorization: authHeader } : {},
  });

  const createMockRes = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = vi.fn().mockImplementation(() => res);
    return res as Response;
  };

  const createMockNext = () => vi.fn() as NextFunction;

  it('should return 401 if Authorization header is missing', () => {
    const req = createMockReq() as AuthenticatedRequest;
    const res = createMockRes();
    const next = createMockNext();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header is not Bearer style', () => {
    const req = createMockReq('Basic c29tZXRva2Vu') as AuthenticatedRequest;
    const res = createMockRes();
    const next = createMockNext();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    const req = createMockReq('Bearer invalidtokenhere') as AuthenticatedRequest;
    const res = createMockRes();
    const next = createMockNext();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'InvalidToken',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired', () => {
    const expiredToken = jwt.sign(
      { sub: 'admin', role: 'admin', exp: Math.floor(Date.now() / 1000) - 10 },
      mockSecret
    );
    const req = createMockReq(`Bearer ${expiredToken}`) as AuthenticatedRequest;
    const res = createMockRes();
    const next = createMockNext();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'TokenExpired',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token role is not admin', () => {
    const userToken = jwt.sign(
      { sub: 'user123', role: 'user' },
      mockSecret
    );
    const req = createMockReq(`Bearer ${userToken}`) as AuthenticatedRequest;
    const res = createMockRes();
    const next = createMockNext();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Forbidden',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() and assign adminId if token is valid and role is admin', () => {
    const validToken = jwt.sign(
      { sub: 'admin-id-456', role: 'admin' },
      mockSecret
    );
    const req = createMockReq(`Bearer ${validToken}`) as AuthenticatedRequest;
    const res = createMockRes();
    const next = createMockNext();

    adminAuth(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(req.adminId).toBe('admin-id-456');
  });
});
