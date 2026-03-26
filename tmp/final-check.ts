import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.auditLog.count();
  const settings = await prisma.systemSetting.findMany();
  console.log('AUDIT LOGS COUNT:', count);
  console.log('SYSTEM SETTINGS:', JSON.stringify(settings, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
