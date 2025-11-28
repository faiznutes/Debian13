import { PrismaClient, Member } from '@prisma/client';
import prisma from '../config/database';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

export interface CreateMemberInput {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
}

export interface UpdateMemberInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  isActive?: boolean;
}

export class MemberService {
  async getMembers(tenantId: string, page: number = 1, limit: number = 10, search?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { memberCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.member.count({ where }),
    ]);

    return {
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMemberById(id: string, tenantId: string): Promise<Member | null> {
    return prisma.member.findFirst({
      where: { id, tenantId },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });
  }

  async getMemberByCode(memberCode: string, tenantId: string): Promise<Member | null> {
    return prisma.member.findFirst({
      where: { memberCode, tenantId },
    });
  }

  async createMember(data: CreateMemberInput, tenantId: string): Promise<Member> {
    // Generate member code
    const memberCode = `MEM${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    // Check if phone already exists
    const existing = await prisma.member.findFirst({
      where: { phone: data.phone, tenantId },
    });

    if (existing) {
      throw new Error('Member with this phone number already exists');
    }

    const member = await prisma.member.create({
      data: {
        ...data,
        tenantId,
        memberCode,
      },
    });

    // Invalidate analytics cache after member creation
    await this.invalidateAnalyticsCache(tenantId);

    return member;
  }

  async updateMember(id: string, data: UpdateMemberInput, tenantId: string): Promise<Member> {
    const member = await this.getMemberById(id, tenantId);
    if (!member) {
      throw new Error('Member not found');
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data,
    });

    // Invalidate analytics cache after member update
    await this.invalidateAnalyticsCache(tenantId);

    return updatedMember;
  }

  async deleteMember(id: string, tenantId: string): Promise<void> {
    const member = await this.getMemberById(id, tenantId);
    if (!member) {
      throw new Error('Member not found');
    }

    await prisma.member.delete({
      where: { id },
    });

    // Invalidate analytics cache after member deletion
    await this.invalidateAnalyticsCache(tenantId);
  }

  /**
   * Invalidate analytics cache for a tenant
   */
  private async invalidateAnalyticsCache(tenantId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      if (redis) {
        // Delete all analytics cache keys for this tenant
        const keys = await redis.keys(`analytics:*:${tenantId}`);
        const keys2 = await redis.keys(`analytics:${tenantId}:*`);
        const allKeys = [...keys, ...keys2];
        if (allKeys.length > 0) {
          await redis.del(...allKeys);
          logger.info('Invalidated analytics cache after member operation', {
            tenantId,
            cacheKeysDeleted: allKeys.length
          });
        }
      }
    } catch (error: any) {
      logger.warn('Failed to invalidate analytics cache', {
        error: error.message,
        tenantId
      });
    }
  }
}

export default new MemberService();

