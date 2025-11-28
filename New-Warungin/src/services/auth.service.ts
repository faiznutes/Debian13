import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';

export interface LoginInput {
  email: string;
  password: string;
}

// Register removed - only super admin can create tenants

export const login = async (input: LoginInput) => {
  // Email and password are already normalized by Zod validator
  const email = input.email; // Already lowercase and trimmed
  const password = input.password; // Already trimmed
  
  // Log for debugging
  console.log('Login attempt:', {
    email,
    passwordLength: password.length,
  });

  // Find user with tenant
  // Note: email can be duplicate across tenants, so prioritize SUPER_ADMIN
  // Email is already normalized to lowercase above
  // Use findMany with take: 1 to avoid prepared statement issues with pgbouncer
  let users = await prisma.user.findMany({
    where: { 
      email: email, // Already normalized to lowercase
      role: 'SUPER_ADMIN', // Try to find Super Admin first
    },
    include: {
      tenant: true,
    },
    take: 1,
  });

  let user = users[0] || null;
  console.log('Super Admin search result:', user ? `${user.name} (${user.role})` : 'Not found');

  // If no Super Admin found, find any user with this email (case-insensitive)
  if (!user) {
    const allUsers = await prisma.user.findMany({
      where: { 
        email: { equals: email, mode: 'insensitive' }, // Case-insensitive search
      },
      include: {
        tenant: true,
      },
      take: 1,
    });
    user = allUsers[0] || null;
    console.log('Any user search result:', user ? `${user.name} (${user.role})` : 'Not found');
    
    // If user found but email case doesn't match, update to lowercase
    if (user && user.email !== email) {
      console.log(`Normalizing email case: ${user.email} → ${email}`);
      await prisma.user.update({
        where: { id: user.id },
        data: { email: email },
      });
      user.email = email; // Update in-memory object
    }
  }

  // Check if user exists first
  if (!user) {
    console.log('User not found for email:', email);
    throw new AppError('Akun tidak ditemukan. Silakan hubungi admin.', 401);
  }
  
  // Check if user is active
  if (!user.isActive) {
    console.log('User is inactive:', user.email);
    throw new AppError('Akun tidak aktif. Silakan hubungi admin.', 401);
  }

  console.log('User found:', {
    name: user.name,
    role: user.role,
    email: user.email,
    isActive: user.isActive,
    tenantActive: user.tenant?.isActive,
  });

  // Super Admin doesn't need active tenant validation
  if (user.role !== 'SUPER_ADMIN') {
    console.log('Checking tenant for non-Super Admin user...');
    console.log('Tenant exists:', !!user.tenant);
    console.log('Tenant active:', user.tenant?.isActive);
    
    if (!user.tenant) {
      console.error('Tenant not found for user:', user.email);
      throw new AppError('Tenant not found', 403);
    }
    
    if (!user.tenant.isActive) {
      console.error('Tenant is inactive for user:', user.email);
      throw new AppError('Tenant is inactive', 403);
    }
    
    console.log('Tenant validation passed');
  } else {
    // Super Admin still needs a tenant (for schema requirement), but it can be inactive
    if (!user.tenant) {
      console.error('Tenant not found for Super Admin');
      throw new AppError('Tenant not found', 403);
    }
    console.log('Super Admin - skipping tenant active check');
  }

  // Verify password
  console.log('Verifying password...');
  const isValidPassword = await bcrypt.compare(password, user.password);
  console.log('Password comparison result:', isValidPassword);
  
  if (!isValidPassword) {
    // Log for debugging
    console.error('Password comparison failed:', {
      email: user.email,
      role: user.role,
      passwordLength: password.length,
      hashLength: user.password.length,
      hashStart: user.password.substring(0, 20),
    });
    throw new AppError('Password salah', 401);
  }
  
  console.log('Password verified successfully');

  // Check store assignment for CASHIER, KITCHEN, and SUPERVISOR roles
  // These roles require an active store to login
  if (user.role === 'CASHIER' || user.role === 'KITCHEN' || user.role === 'SUPERVISOR') {
    const permissions = user.permissions as any;
    
    if (user.role === 'CASHIER' || user.role === 'KITCHEN') {
      // Check assignedStoreId for CASHIER and KITCHEN
      const assignedStoreId = permissions?.assignedStoreId;
      
      if (!assignedStoreId) {
        throw new AppError(
          'Store belum ditetapkan untuk akun Anda. Silakan hubungi administrator untuk menetapkan store terlebih dahulu.',
          403
        );
      }
      
      // Check if assigned store is active
      const assignedStore = await prisma.outlet.findFirst({
        where: {
          id: assignedStoreId,
          tenantId: user.tenantId || user.tenant?.id || '',
        },
      });
      
      if (!assignedStore) {
        throw new AppError(
          'Store yang ditetapkan tidak ditemukan. Silakan hubungi administrator.',
          403
        );
      }
      
      if (!assignedStore.isActive) {
        throw new AppError(
          `Store "${assignedStore.name}" yang ditetapkan untuk akun Anda saat ini tidak aktif. Silakan hubungi administrator untuk memindahkan Anda ke store aktif terlebih dahulu.`,
          403
        );
      }
      
      console.log('Store validation passed for CASHIER/KITCHEN:', {
        storeId: assignedStoreId,
        storeName: assignedStore.name,
        isActive: assignedStore.isActive,
      });
    } else if (user.role === 'SUPERVISOR') {
      // Check allowedStoreIds for SUPERVISOR
      const allowedStoreIds = permissions?.allowedStoreIds || [];
      
      if (allowedStoreIds.length === 0) {
        throw new AppError(
          'Belum ada store yang diizinkan untuk akun Anda. Silakan hubungi administrator untuk menetapkan store terlebih dahulu.',
          403
        );
      }
      
      // Check if at least one allowed store is active
      const allowedStores = await prisma.outlet.findMany({
        where: {
          id: { in: allowedStoreIds },
          tenantId: user.tenantId || user.tenant?.id || '',
        },
      });
      
      if (allowedStores.length === 0) {
        throw new AppError(
          'Store yang diizinkan tidak ditemukan. Silakan hubungi administrator.',
          403
        );
      }
      
      const activeStores = allowedStores.filter(store => store.isActive);
      
      if (activeStores.length === 0) {
        const storeNames = allowedStores.map(s => s.name).join(', ');
        throw new AppError(
          `Semua store yang diizinkan untuk akun Anda (${storeNames}) saat ini tidak aktif. Silakan hubungi administrator untuk memindahkan Anda ke store aktif terlebih dahulu.`,
          403
        );
      }
      
      console.log('Store validation passed for SUPERVISOR:', {
        allowedStoreIds,
        activeStores: activeStores.map(s => ({ id: s.id, name: s.name })),
      });
    }
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Ensure tenantId is set (should not be null for non-Super Admin users)
  const tenantId = user.tenantId || user.tenant?.id;
  
  if (!tenantId && user.role !== 'SUPER_ADMIN') {
    console.error('Tenant ID missing for non-Super Admin user:', {
      userId: user.id,
      role: user.role,
      email: user.email,
      userTenantId: user.tenantId,
      tenantId: user.tenant?.id,
    });
    throw new AppError('Tenant ID not found. Please contact administrator.', 500);
  }

  // Generate token
  const tokenPayload: TokenPayload = {
    userId: user.id,
    tenantId: tenantId || '', // Use empty string for Super Admin if no tenantId
    role: user.role,
    email: user.email,
  };

  const token = generateToken(tokenPayload);

  const response = {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: tenantId || null,
      tenantName: user.tenant?.name || null,
      permissions: user.permissions || null, // Include permissions in login response
    },
  };
  
  console.log('Login successful:', {
    email: user.email,
    role: user.role,
    tenantName: user.tenant?.name,
  });
  
  return response;
};

// Register function removed - tenant creation is now handled by tenant.service.ts

