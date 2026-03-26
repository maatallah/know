import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 50 audit logs...');
  const logs = [];
  for (let i = 0; i < 50; i++) {
    logs.push({
      action: 'UPDATE',
      entityType: 'MACHINE',
      entityId: `test-machine-${i}`,
      details: { note: `Test log ${i}` },
      createdAt: new Date(Date.now() - (i * 3600000)) // 1 hour apart
    });
  }
  await prisma.auditLog.createMany({ data: logs });
  console.log('Done.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
