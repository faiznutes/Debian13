import { PrismaClient } from '@prisma/client';

// Clean DATABASE_URL to fix format issues
function cleanDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error('DATABASE_URL is not defined');
  }
  
  let cleanedUrl = url;
  
  // Remove "DATABASE_URL=" prefix if present
  if (cleanedUrl.startsWith('DATABASE_URL=')) {
    cleanedUrl = cleanedUrl.replace('DATABASE_URL=', '');
  }
  // Remove "DATABASE_URL=" if present at the end
  cleanedUrl = cleanedUrl.replace(/DATABASE_URL=$/g, '');
  cleanedUrl = cleanedUrl.replace(/DATABASE_URL=/g, '');
  
  // Trim whitespace
  cleanedUrl = cleanedUrl.trim();
  
  // Remove duplicate schema parameters (if any)
  cleanedUrl = cleanedUrl.replace(/schema=publicschema=public/g, 'schema=public');
  cleanedUrl = cleanedUrl.replace(/&schema=public&schema=public/g, '&schema=public');
  cleanedUrl = cleanedUrl.replace(/\?schema=public&schema=public/g, '?schema=public');
  
  // Validate URL format
  if (!cleanedUrl.startsWith('postgresql://') && !cleanedUrl.startsWith('postgres://')) {
    throw new Error(`Invalid DATABASE_URL format: URL must start with postgresql:// or postgres://`);
  }
  
  return cleanedUrl;
}

// Get cleaned DATABASE_URL
const databaseUrl = cleanDatabaseUrl(process.env.DATABASE_URL);

// Configure connection pool for 50 concurrent users
// Each user may have multiple concurrent requests, so we need adequate connections
const connectionPoolSize = 50; // Base pool size for 50 users
const maxConnections = 100; // Maximum connections (2x users for peak load)

// Check if using pgbouncer (Supabase pooler)
const isPgbouncer = databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes('pgbouncer=true');

// For pgbouncer, ensure proper connection parameters
let finalDatabaseUrl = databaseUrl;
if (isPgbouncer) {
  try {
    // Ensure pgbouncer=true and connection_limit=1 for pgbouncer
    // This prevents "prepared statement already exists" errors
    const url = new URL(databaseUrl);
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('connection_limit', '1');
    finalDatabaseUrl = url.toString();
  } catch (error) {
    // If URL parsing fails, try manual string manipulation
    // Note: Using console.warn here because logger might not be initialized yet
    // This is during module initialization, before app starts
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to parse DATABASE_URL, using original:', error);
    }
    // Add parameters manually if not present
    if (!finalDatabaseUrl.includes('pgbouncer=true')) {
      finalDatabaseUrl += (finalDatabaseUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    if (!finalDatabaseUrl.includes('connection_limit=')) {
      finalDatabaseUrl += '&connection_limit=1';
    }
  }
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' },
      ]
    : ['error'],
  datasources: {
    db: {
      url: finalDatabaseUrl, // Use URL with pgbouncer parameters if needed
    },
  },
  // Connection pool settings optimized for 50 concurrent users
  // Prisma uses connection pooling via the database URL
  // For Supabase pooler, connections are managed by pgbouncer
  // For direct connections, we rely on database connection limits
});

// Note: RLS context is set via Express middleware (setRLSContext)
// and applied using $executeRawUnsafe before queries when needed.
// Prisma middleware doesn't have access to request context directly,
// so we rely on application-level tenant filtering as primary security.
// RLS policies in database provide additional defense-in-depth.

// Enhanced logging for development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    console.log('🔵 Prisma Query:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      target: e.target,
    });
  });

  prisma.$on('error' as never, (e: any) => {
    console.error('🔴 Prisma Error:', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString(),
    });
  });

  prisma.$on('warn' as never, (e: any) => {
    console.warn('🟡 Prisma Warning:', {
      message: e.message,
      target: e.target,
    });
  });

  prisma.$on('info' as never, (e: any) => {
    console.info('ℹ️  Prisma Info:', {
      message: e.message,
      target: e.target,
    });
  });
}

// Test connection on startup
async function testConnection() {
  try {
    await prisma.$connect();
    // Using console.log here because logger might not be initialized yet
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Database connection established');
    }
  } catch (error: unknown) {
    const err = error as Error;
    // Using console.error here because logger might not be initialized yet
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check your DATABASE_URL in .env file');
    // Don't exit - let the app start and handle errors gracefully
  }
}

// Test connection immediately (non-blocking)
testConnection().catch((error) => {
  // Using console.error here because logger might not be initialized yet
  console.error('Failed to test database connection:', error);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Note: Error event handler is now set up above with enhanced logging for development

export default prisma;

