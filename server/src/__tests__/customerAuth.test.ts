import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { customerAuth, AuthenticatedCustomerRequest, CUSTOMER_JWT_AUDIENCE } from '../middleware/customerAuth';
import { JWT_ISSUER } from '../middleware/adminAuth';
import prisma from '../db';

vi.mock('../db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Customer Authentication Middleware', () => {
  const mockSecret = 'test-jwt-secret-for-customer-unit-tests-only';

  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', mockSecret);
    vi.clearAllMocks();
  });

  const createMockReq = (authHeader?: string, cookies?: Record<string, string>): Partial<AuthenticatedCustomerRequest> => ({
    headers: {
      ...(authHeader ? { authorization: authHeader } : {}),
      cookie: cookies ? Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ') : '',
    },
    method: 'GET',
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

  it('should return 401 if no authentication token is provided', async () => {
    const req = createMockReq() as AuthenticatedCustomerRequest;
    const res = createMockRes();
    const next = createMockNext();

    await customerAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is verified but user is not in database', async () => {
    const token = jwt.sign(
      { sub: 'nonexistent-user-id', email: 'test@rephonix.in', iss: JWT_ISSUER, aud: CUSTOMER_JWT_AUDIENCE },
      mockSecret
    );
    const req = createMockReq(`Bearer ${token}`) as AuthenticatedCustomerRequest;
    const res = createMockRes();
    const next = createMockNext();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await customerAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
        message: 'User not found.',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.userId and call next() on valid token', async () => {
    const token = jwt.sign(
      { sub: 'user-12345', email: 'test@rephonix.in', iss: JWT_ISSUER, aud: CUSTOMER_JWT_AUDIENCE },
      mockSecret
    );
    const req = createMockReq(`Bearer ${token}`) as AuthenticatedCustomerRequest;
    const res = createMockRes();
    const next = createMockNext();

    const mockUser = {
      id: 'user-12345',
      name: 'John Doe',
      email: 'test@rephonix.in',
      phone: '9876543210',
      passwordHash: 'hashedpwd',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await customerAuth(req, res, next);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-12345' } });
    expect(req.userId).toBe('user-12345');
    expect(req.customer).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});
