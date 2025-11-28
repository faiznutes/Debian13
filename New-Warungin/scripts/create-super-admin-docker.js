const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Clean DATABASE_URL to fix format issues (same as in database.ts)
function cleanDatabaseUrl(url) {
  if (!url) {
    throw new Error('DATABASE_URL is not defined');
  }
  
  let cleanedUrl = url;
  
  // Remove "DATABASE_URL=" prefix if present
  if (cleanedUrl.startsWith('DATABASE_URL=')) {
    cleanedUrl = cleanedUrl.replace('DATABASE_URL=', '');
  }
  cleanedUrl = cleanedUrl.replace(/DATABASE_URL=$/g, '');
  cleanedUrl = cleanedUrl.replace(/DATABASE_URL=/g, '');
  
  // Trim whitespace
  cleanedUrl = cleanedUrl.trim();
  
  // Remove duplicate schema parameters
  cleanedUrl = cleanedUrl.replace(/schema=publicschema=public/g, 'schema=public');
  cleanedUrl = cleanedUrl.replace(/&schema=public&schema=public/g, '&schema=public');
  cleanedUrl = cleanedUrl.replace(/\?schema=public&schema=public/g, '?schema=public');
  
  // Validate URL format
  if (!cleanedUrl.startsWith('postgresql://') && !cleanedUrl.startsWith('postgres://')) {
    throw new Error(`Invalid DATABASE_URL format: URL must start with postgresql:// or postgres://`);
  }
  
  return cleanedUrl;
}

// Get cleaned DATABASE_URL - use default for Docker if not set
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.trim() === '') {
  // Default for Docker Compose
  databaseUrl = 'postgresql://postgres:warungin_db_password_2024@postgres:5432/warungin?schema=public';
}

const cleanedUrl = cleanDatabaseUrl(databaseUrl);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: cleanedUrl,
    },
  },
});

async function main() {
  console.log('🔧 Creating Super Admin...\n');

  try {
    // Create a special tenant for Super Admin
    let superAdminTenant = await prisma.tenant.findFirst({
      where: { email: 'super@warungin.com' },
    });

    if (!superAdminTenant) {
      superAdminTenant = await prisma.tenant.create({
        data: {
          name: 'Super Admin System',
          email: 'super@warungin.com',
          slug: 'super-admin-system',
          isActive: true,
        },
      });
      console.log('✅ Created Super Admin tenant');
    } else {
      console.log('✅ Super Admin tenant already exists');
    }

    // Create Super Admin user
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const superAdmin = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: superAdminTenant.id,
          email: 'admin@warungin.com',
        },
      },
      update: {
        role: 'SUPER_ADMIN',
        password: hashedPassword,
        isActive: true,
      },
      create: {
        tenantId: superAdminTenant.id,
        email: 'admin@warungin.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log('\n✅ Super Admin created/updated successfully!');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   Email: admin@warungin.com');
    console.log('   Password: admin123');
    console.log('   Role: SUPER_ADMIN');
    console.log('');
    console.log('⚠️  IMPORTANT: Change password after first login!');
    console.log('');
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

