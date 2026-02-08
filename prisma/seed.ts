import { seedRBAC } from './seed/rbac.seed';
import { seedSuperAdmin } from './seed/super-admin.seed';

async function main() {
  await seedRBAC();
  await seedSuperAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
