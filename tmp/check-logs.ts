import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.auditLog.count();
  const settings = await prisma.systemSetting.findMany();
  console.log('--- LOG STATUS ---');
  console.log('Total Logs:', count);
  console.log('Settings:', JSON.stringify(settings, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
