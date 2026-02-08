import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { SUPER_ADMIN } from './super-admin.data';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';


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
export async function seedSuperAdmin() {
  console.log('🌱 Seeding SUPER_ADMIN user...');

  const existing = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN.email },
  });

  if (existing) {
    console.log('ℹ️ SUPER_ADMIN already exists, skipping');
    return;
  }

  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);

  const user = await prisma.user.create({
    data: {
      email: SUPER_ADMIN.email,
      password: hashedPassword,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: SUPER_ADMIN.role,
    },
  });

  console.log('✅ SUPER_ADMIN created');

  await pool.end();
}
