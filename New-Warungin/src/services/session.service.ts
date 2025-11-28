/**
 * Session Management Service
 * Redis-based session tracking and management
 */

import { getRedisClient } from '../config/redis';
import prisma from '../config/database';
import logger from '../utils/logger';
import crypto from 'crypto';

export interface Session {
  id: string;
  userId: string;
  tenantId?: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user:sessions:';
  private readonly SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  /**
   * Create new session
   */
  async createSession(
    userId: string,
    tenantId: string | null,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Session> {
    const redis = await getRedisClient();
    if (!redis) {
      throw new Error('Redis client not available');
    }
    const sessionId = crypto.randomBytes(32).toString('hex');

    const session: Session = {
      id: sessionId,
      userId,
      tenantId: tenantId || undefined,
      deviceInfo,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000),
    };

    // Store session in Redis
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    await redis.setex(sessionKey, this.SESSION_TTL, JSON.stringify(session));

    // Add to user's session list
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    await redis.sadd(userSessionsKey, sessionId);
    await redis.expire(userSessionsKey, this.SESSION_TTL);

    logger.info('Session created', { userId, sessionId });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const redis = await getRedisClient();
    if (!redis) {
      return null;
    }
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      return null;
    }

    const session: Session = JSON.parse(sessionData);
    
    // Update last activity
    session.lastActivity = new Date();
    await redis.setex(sessionKey, this.SESSION_TTL, JSON.stringify(session));

    return session;
  }

  /**
   * Get all active sessions for user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const redis = await getRedisClient();
    if (!redis) {
      return [];
    }
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await redis.smembers(userSessionsKey);

    const sessions: Session[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const redis = await getRedisClient();
    if (!redis) {
      return false;
    }
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    
    // Get session to find userId
    const sessionData = await redis.get(sessionKey);
    if (!sessionData) {
      return false;
    }

    const session: Session = JSON.parse(sessionData);

    // Delete session
    await redis.del(sessionKey);

    // Remove from user's session list
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${session.userId}`;
    await redis.srem(userSessionsKey, sessionId);

    logger.info('Session revoked', { userId: session.userId, sessionId });

    return true;
  }

  /**
   * Revoke all sessions for user (except current session)
   */
  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const redis = await getRedisClient();
    if (!redis) {
      return 0;
    }
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await redis.smembers(userSessionsKey);

    let revokedCount = 0;
    for (const sessionId of sessionIds) {
      if (sessionId !== exceptSessionId) {
        await this.revokeSession(sessionId);
        revokedCount++;
      }
    }

    logger.info('All user sessions revoked', { userId, revokedCount, exceptSessionId });

    return revokedCount;
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      // Already updated in getSession
      return;
    }
  }

  /**
   * Check if session is valid
   */
  async isValidSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      await this.revokeSession(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const redis = await getRedisClient();
    // This would require scanning all sessions, which is expensive
    // Better to use Redis TTL expiration or scheduled job
    // For now, sessions expire automatically via TTL
    return 0;
  }

  /**
   * Get session count for user
   */
  async getSessionCount(userId: string): Promise<number> {
    const redis = await getRedisClient();
    if (!redis) {
      return 0;
    }
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    return await redis.scard(userSessionsKey);
  }
}

export default new SessionService();

