/**
 * Integration tests for Auth Routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import prisma from '../../../src/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../../../src/config/env';

// Mock dependencies
vi.mock('../../../src/config/database', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(() => Promise.resolve([])),
    $disconnect: vi.fn(() => Promise.resolve()),
    $connect: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../../../src/utils/jwt', () => ({
  generateToken: vi.fn((payload: any) => `mock-token-${payload.userId}`),
}));

describe('Auth Routes - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return tokens and user on successful login', async () => {
      const mockUser = {
        id: 'user123',
        tenantId: 'tenant123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'ADMIN_TENANT',
        isActive: true,
        twoFactorEnabled: false,
        tenant: {
          id: 'tenant123',
          name: 'Test Tenant',
          isActive: true,
        },
      };

      (prisma.user.findMany as any).mockResolvedValueOnce([mockUser]);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue('mockAccessToken');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 with invalid credentials', async () => {
      (prisma.user.findMany as any).mockResolvedValueOnce([]);
      (prisma.user.findMany as any).mockResolvedValueOnce([]);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpassword' });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 when user is inactive', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'ADMIN_TENANT',
        isActive: false,
        tenant: {
          id: 'tenant123',
          isActive: true,
        },
      };

      (prisma.user.findMany as any).mockResolvedValueOnce([mockUser]);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 when password is incorrect', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'ADMIN_TENANT',
        isActive: true,
        tenant: {
          id: 'tenant123',
          isActive: true,
        },
      };

      (prisma.user.findMany as any).mockResolvedValueOnce([mockUser]);
      (bcrypt.compare as any).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.statusCode).toBe(401);
    });
  });
});
