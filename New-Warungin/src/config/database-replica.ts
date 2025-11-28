/**
 * Database Read Replica Configuration
 * Use read replica for reporting and read-heavy queries
 */

import { PrismaClient } from '@prisma/client';

/**
 * Clean database URL (remove query parameters for connection pooling)
 */
function cleanDatabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove query parameters that might interfere with connection
    urlObj.search = '';
    return urlObj.toString();
  } catch {
    return url;
  }
}

let readReplicaClient: PrismaClient | null = null;

/**
 * Get read replica Prisma client
 * Falls back to main database if read replica is not configured
 */
export function getReadReplicaClient(): PrismaClient {
  if (!readReplicaClient) {
    const readReplicaUrl = process.env.DATABASE_READ_URL || process.env.DATABASE_URL;
    
    if (!readReplicaUrl) {
      throw new Error('DATABASE_READ_URL or DATABASE_URL must be set');
    }

    const cleanedUrl = cleanDatabaseUrl(readReplicaUrl);

    readReplicaClient = new PrismaClient({
      datasources: {
        db: {
          url: cleanedUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  return readReplicaClient;
}

/**
 * Use read replica for read operations
 * Example: const users = await getReadReplicaClient().user.findMany();
 */
export default getReadReplicaClient;

