/**
 * Unit tests for Auth Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { login } from '../../../src/services/auth.service';
import prisma from '../../../src/config/database';
import { AppError } from '../../../src/middlewares/errorHandler';

// Mock dependencies
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../../../src/utils/jwt', () => ({
  generateToken: vi.fn((payload: any) => `mock-token-${payload.userId}`),
}));

describe('Auth Service - Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return token and user on successful login', async () => {
    const mockUser = {
      id: 'user123',
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
    (jwt.sign as any).mockReturnValue('mock-access-token');

    const result = await login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result).toHaveProperty('user');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
  });

  it('should throw error when user not found', async () => {
    (prisma.user.findMany as any).mockResolvedValueOnce([]);
    (prisma.user.findMany as any).mockResolvedValueOnce([]);

    await expect(
      login({
        email: 'nonexistent@example.com',
        password: 'password123',
      })
    ).rejects.toThrow(AppError);

    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('should throw error when user is inactive', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'ADMIN_TENANT',
      isActive: false,
      tenant: {
        id: 'tenant123',
        name: 'Test Tenant',
        isActive: true,
      },
    };

    (prisma.user.findMany as any).mockResolvedValueOnce([mockUser]);

    await expect(
      login({
        email: 'test@example.com',
        password: 'password123',
      })
    ).rejects.toThrow(AppError);

    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('should throw error on invalid password', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'ADMIN_TENANT',
      isActive: true,
      tenant: {
        id: 'tenant123',
        name: 'Test Tenant',
        isActive: true,
      },
    };

    (prisma.user.findMany as any).mockResolvedValueOnce([mockUser]);
    (bcrypt.compare as any).mockResolvedValue(false);

    await expect(
      login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow(AppError);

    expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
  });

  it('should throw error when tenant is inactive for non-super-admin', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'ADMIN_TENANT',
      isActive: true,
      tenant: {
        id: 'tenant123',
        name: 'Test Tenant',
        isActive: false,
      },
    };

    (prisma.user.findMany as any).mockResolvedValueOnce([mockUser]);
    (bcrypt.compare as any).mockResolvedValue(true);

    await expect(
      login({
        email: 'test@example.com',
        password: 'password123',
      })
    ).rejects.toThrow(AppError);
  });

  it('should allow login for SUPER_ADMIN without active tenant', async () => {
    const mockUser = {
      id: 'user123',
      email: 'admin@example.com',
      password: 'hashedpassword',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      tenant: null,
    };

    (prisma.user.findMany as any).mockResolvedValueOnce([mockUser]);
    (bcrypt.compare as any).mockResolvedValue(true);

    const result = await login({
      email: 'admin@example.com',
      password: 'password123',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result.user.role).toBe('SUPER_ADMIN');
  });
});
