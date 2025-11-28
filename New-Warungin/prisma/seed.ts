import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create system tenant for Super Admin (required by schema)
  let systemTenant = await prisma.tenant.findFirst({
    where: { email: 'system@warungin.com' },
  });

  if (!systemTenant) {
    systemTenant = await prisma.tenant.create({
      data: {
        name: 'System',
        email: 'system@warungin.com',
        slug: 'system',
        isActive: true,
      },
    });
    console.log('✅ Created system tenant');
  }

  // Create Super Admin user
  const superAdminPasswordPlain = 'admin123';
  const superAdminPassword = await bcrypt.hash(superAdminPasswordPlain, 10);
  const superAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: systemTenant.id,
        email: 'admin@warungin.com',
      },
    },
    update: {
      defaultPassword: superAdminPasswordPlain, // Update default password
    },
    create: {
      tenantId: systemTenant.id,
      email: 'admin@warungin.com',
      password: superAdminPassword,
      defaultPassword: superAdminPasswordPlain, // Store default password
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created Super Admin user:', superAdmin.email);
  console.log('📝 Super Admin credentials:');
  console.log('   Email: admin@warungin.com');
  console.log('   Password: admin123\n');

  // Create sample tenant
  const tenant = await prisma.tenant.upsert({
    where: { email: 'demo@warungin.com' },
    update: {},
    create: {
      name: 'Demo Warung',
      email: 'demo@warungin.com',
      phone: '+6281234567890',
      slug: 'demo-warung',
      isActive: true,
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create users for demo tenant
  const passwordPlain = 'password123';
  const cashierPasswordPlain = 'cashier123';
  const kitchenPasswordPlain = 'kitchen123';
  const spvPasswordPlain = 'spv123';
  
  const hashedPassword = await bcrypt.hash(passwordPlain, 10);
  const hashedPasswordCashier = await bcrypt.hash(cashierPasswordPlain, 10);
  const hashedPasswordKitchen = await bcrypt.hash(kitchenPasswordPlain, 10);
  const hashedPasswordSPV = await bcrypt.hash(spvPasswordPlain, 10);

  // Create Admin Tenant
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@demo.com',
      },
    },
    update: {
      defaultPassword: passwordPlain, // Update default password
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      password: hashedPassword,
      defaultPassword: passwordPlain, // Store default password
      name: 'Admin Demo',
      role: 'ADMIN_TENANT',
      isActive: true,
    },
  });

  // Create Cashier 1
  const cashier1 = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'kasir1@demo.com',
      },
    },
    update: {
      defaultPassword: cashierPasswordPlain, // Update default password
    },
    create: {
      tenantId: tenant.id,
      email: 'kasir1@demo.com',
      password: hashedPasswordCashier,
      defaultPassword: cashierPasswordPlain, // Store default password
      name: 'Kasir 1',
      role: 'CASHIER',
      isActive: true,
    },
  });

  // Create Cashier 2
  const cashier2 = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'kasir2@demo.com',
      },
    },
    update: {
      defaultPassword: cashierPasswordPlain, // Update default password
    },
    create: {
      tenantId: tenant.id,
      email: 'kasir2@demo.com',
      password: hashedPasswordCashier,
      defaultPassword: cashierPasswordPlain, // Store default password
      name: 'Kasir 2',
      role: 'CASHIER',
      isActive: true,
    },
  });

  // Create Kitchen
  const kitchen = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'kitchen@demo.com',
      },
    },
    update: {
      defaultPassword: kitchenPasswordPlain, // Update default password
    },
    create: {
      tenantId: tenant.id,
      email: 'kitchen@demo.com',
      password: hashedPasswordKitchen,
      defaultPassword: kitchenPasswordPlain, // Store default password
      name: 'Kitchen Staff',
      role: 'KITCHEN',
      isActive: true,
    },
  });

  // Create Supervisor
  const supervisor = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'spv@demo.com',
      },
    },
    update: {
      defaultPassword: spvPasswordPlain, // Update default password
    },
    create: {
      tenantId: tenant.id,
      email: 'spv@demo.com',
      password: hashedPasswordSPV,
      defaultPassword: spvPasswordPlain, // Store default password
      name: 'Supervisor',
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  console.log('✅ Created users for tenant:', tenant.name);
  console.log('\n📝 User Credentials:');
  console.log('   👤 Admin Tenant:');
  console.log('      Email: admin@demo.com');
  console.log('      Password: password123');
  console.log('   💰 Cashier 1:');
  console.log('      Email: kasir1@demo.com');
  console.log('      Password: cashier123');
  console.log('   💰 Cashier 2:');
  console.log('      Email: kasir2@demo.com');
  console.log('      Password: cashier123');
  console.log('   👨‍🍳 Kitchen:');
  console.log('      Email: kitchen@demo.com');
  console.log('      Password: kitchen123');
  console.log('   👔 Supervisor:');
  console.log('      Email: spv@demo.com');
  console.log('      Password: spv123');

  console.log('\n✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

