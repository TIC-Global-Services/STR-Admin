import { PrismaClient, RoleType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from './rbac.data';

// Create pool and adapter 
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('No DATABASE_URL or DIRECT_URL found in environment');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  adapter,
});

export async function seedRBAC() {
  console.log('🌱 Seeding roles...');
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: {
        id: role,
        name: role,
      },
    });
  }

  console.log('🌱 Seeding permissions...');
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: {
        id: key,
        key,
      },
    });
  }

  console.log('🌱 Seeding role-permissions...');
  for (const role of Object.keys(ROLE_PERMISSIONS) as RoleType[]) {
    const permissions = ROLE_PERMISSIONS[role];

    for (const permissionKey of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role,
            permissionId: permissionKey,
          },
        },
        update: {},
        create: {
          roleId: role,
          permissionId: permissionKey,
        },
      });
    }
  }

  console.log('✅ RBAC seeding completed');

  await pool.end();
}