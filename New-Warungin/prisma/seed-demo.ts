import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');
  console.log('💡 Note: Super Admin should be created separately using: npm run prisma:seed');
  console.log('');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const hashedPasswordCashier = await bcrypt.hash('cashier123', 10);

  // Create Tenant 1: Warung Makan Sederhana
  const tenant1 = await prisma.tenant.upsert({
    where: { email: 'warung1@demo.com' },
    update: {},
    create: {
      name: 'Warung Makan Sederhana',
      email: 'warung1@demo.com',
      phone: '+6281234567890',
      slug: 'warung-makan-sederhana',
      isActive: true,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      subscriptionPlan: 'BASIC',
    },
  });

  console.log('✅ Created Tenant 1:', tenant1.name);

  // Create users for tenant 1
  const tenant1Admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant1.id,
        email: 'admin1@demo.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant1.id,
      email: 'admin1@demo.com',
      password: hashedPassword,
      name: 'Admin Warung 1',
      role: 'ADMIN_TENANT',
      isActive: true,
    },
  });

  const tenant1Cashier1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'cashier1@demo.com',
      password: hashedPasswordCashier,
      name: 'Kasir 1',
      role: 'CASHIER',
      isActive: true,
    },
  });

  const tenant1Cashier2 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'cashier2@demo.com',
      password: hashedPasswordCashier,
      name: 'Kasir 2',
      role: 'CASHIER',
      isActive: true,
    },
  });

  const tenant1Kitchen = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'kitchen1@demo.com',
      password: hashedPasswordCashier,
      name: 'Dapur 1',
      role: 'KITCHEN',
      isActive: true,
    },
  });

  const tenant1Supervisor = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'supervisor1@demo.com',
      password: hashedPasswordCashier,
      name: 'Supervisor 1',
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  console.log('✅ Created users for Tenant 1');
  console.log('   Admin: admin1@demo.com / admin123');
  console.log('   Cashier 1: cashier1@demo.com / cashier123');
  console.log('   Cashier 2: cashier2@demo.com / cashier123');
  console.log('   Kitchen: kitchen1@demo.com / cashier123');
  console.log('   Supervisor: supervisor1@demo.com / cashier123');

  // Create products for tenant 1
  const products1 = [
    {
      tenantId: tenant1.id,
      name: 'Nasi Goreng',
      description: 'Nasi goreng spesial dengan telur dan ayam',
      sku: 'NG001',
      barcode: '1234567890123',
      price: 15000,
      cost: 8000,
      stock: 50,
      minStock: 10,
      category: 'Makanan',
      isActive: true,
    },
    {
      tenantId: tenant1.id,
      name: 'Mie Ayam',
      description: 'Mie ayam dengan bakso dan pangsit',
      sku: 'MA001',
      barcode: '1234567890124',
      price: 12000,
      cost: 6000,
      stock: 40,
      minStock: 10,
      category: 'Makanan',
      isActive: true,
    },
    {
      tenantId: tenant1.id,
      name: 'Es Teh Manis',
      description: 'Es teh manis segar',
      sku: 'ETM001',
      barcode: '1234567890125',
      price: 3000,
      cost: 1000,
      stock: 100,
      minStock: 20,
      category: 'Minuman',
      isActive: true,
    },
    {
      tenantId: tenant1.id,
      name: 'Es Jeruk',
      description: 'Es jeruk peras segar',
      sku: 'EJ001',
      barcode: '1234567890126',
      price: 5000,
      cost: 2000,
      stock: 80,
      minStock: 20,
      category: 'Minuman',
      isActive: true,
    },
    {
      tenantId: tenant1.id,
      name: 'Kerupuk',
      description: 'Kerupuk goreng renyah',
      sku: 'KR001',
      barcode: '1234567890127',
      price: 2000,
      cost: 500,
      stock: 200,
      minStock: 50,
      category: 'Snack',
      isActive: true,
    },
  ];

  await prisma.product.createMany({
    data: products1,
    skipDuplicates: true,
  });

  console.log('✅ Created 5 products for Tenant 1');

  // Create customers for tenant 1
  const customers1 = [
    {
      tenantId: tenant1.id,
      name: 'Budi Santoso',
      email: 'budi@example.com',
      phone: '+6281234567891',
      address: 'Jl. Contoh No. 123',
      loyaltyPoints: 100,
    },
    {
      tenantId: tenant1.id,
      name: 'Siti Nurhaliza',
      email: 'siti@example.com',
      phone: '+6281234567892',
      address: 'Jl. Contoh No. 456',
      loyaltyPoints: 50,
    },
    {
      tenantId: tenant1.id,
      name: 'Ahmad Fauzi',
      phone: '+6281234567893',
      loyaltyPoints: 0,
    },
  ];

  await prisma.customer.createMany({
    data: customers1,
    skipDuplicates: true,
  });

  console.log('✅ Created 3 customers for Tenant 1');

  // Create members for tenant 1
  const members1 = [
    {
      tenantId: tenant1.id,
      name: 'Member Premium',
      email: 'member1@example.com',
      phone: '+6281234567894',
      memberCode: 'MEM001',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      isActive: true,
      loyaltyPoints: 500,
    },
    {
      tenantId: tenant1.id,
      name: 'Member Gold',
      email: 'member2@example.com',
      phone: '+6281234567895',
      memberCode: 'MEM002',
      discountType: 'FIXED',
      discountValue: 5000,
      isActive: true,
      loyaltyPoints: 300,
    },
  ];

  await prisma.member.createMany({
    data: members1,
    skipDuplicates: true,
  });

  console.log('✅ Created 2 members for Tenant 1');

  // Create Tenant 2: Toko Kelontong Sejahtera
  const tenant2 = await prisma.tenant.upsert({
    where: { email: 'warung2@demo.com' },
    update: {},
    create: {
      name: 'Toko Kelontong Sejahtera',
      email: 'warung2@demo.com',
      phone: '+6281234567896',
      slug: 'toko-kelontong-sejahtera',
      isActive: true,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      subscriptionPlan: 'PRO',
    },
  });

  console.log('✅ Created Tenant 2:', tenant2.name);

  // Create users for tenant 2
  const tenant2Admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant2.id,
        email: 'admin2@demo.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant2.id,
      email: 'admin2@demo.com',
      password: hashedPassword,
      name: 'Admin Toko 2',
      role: 'ADMIN_TENANT',
      isActive: true,
    },
  });

  const tenant2Cashier1 = await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      email: 'cashier2a@demo.com',
      password: hashedPasswordCashier,
      name: 'Kasir Toko 2',
      role: 'CASHIER',
      isActive: true,
    },
  });

  console.log('✅ Created users for Tenant 2');
  console.log('   Admin: admin2@demo.com / admin123');
  console.log('   Cashier: cashier2a@demo.com / cashier123');

  // Create products for tenant 2
  const products2 = [
    {
      tenantId: tenant2.id,
      name: 'Beras Premium',
      description: 'Beras kualitas premium 5kg',
      sku: 'BP001',
      barcode: '2234567890123',
      price: 75000,
      cost: 60000,
      stock: 30,
      minStock: 5,
      category: 'Sembako',
      isActive: true,
    },
    {
      tenantId: tenant2.id,
      name: 'Minyak Goreng',
      description: 'Minyak goreng 2 liter',
      sku: 'MG001',
      barcode: '2234567890124',
      price: 25000,
      cost: 20000,
      stock: 60,
      minStock: 10,
      category: 'Sembako',
      isActive: true,
    },
    {
      tenantId: tenant2.id,
      name: 'Gula Pasir',
      description: 'Gula pasir 1kg',
      sku: 'GP001',
      barcode: '2234567890125',
      price: 15000,
      cost: 12000,
      stock: 50,
      minStock: 10,
      category: 'Sembako',
      isActive: true,
    },
  ];

  await prisma.product.createMany({
    data: products2,
    skipDuplicates: true,
  });

  console.log('✅ Created 3 products for Tenant 2');

  console.log('');
  console.log('📋 Summary:');
  console.log('');
  console.log('🏪 TENANT 1: Warung Makan Sederhana');
  console.log('   Admin: admin1@demo.com / admin123');
  console.log('   Products: 5');
  console.log('   Customers: 3');
  console.log('   Members: 2');
  console.log('');
  console.log('🏪 TENANT 2: Toko Kelontong Sejahtera');
  console.log('   Admin: admin2@demo.com / admin123');
  console.log('   Products: 3');
  console.log('');
  console.log('✅ Demo data seeding completed!');
  console.log('');
  console.log('💡 Tips:');
  console.log('   - Login as SUPER ADMIN to see tenant selector');
  console.log('   - Login as Tenant Admin to see their own data');
  console.log('   - Use cashier accounts to test order management');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

