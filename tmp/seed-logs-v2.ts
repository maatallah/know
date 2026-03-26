import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) {
    console.error('No admin found');
    return;
  }
  
  console.log('Seeding 2000 audit logs for admin:', admin.id);
  
  const BATCH_SIZE = 100;
  for (let i = 0; i < 20; i++) {
    const logs = [];
    for (let j = 0; j < BATCH_SIZE; j++) {
      logs.push({
        action: 'UPDATE',
        entityType: 'MACHINE',
        entityId: `machine-${i*BATCH_SIZE+j}`,
        userId: admin.id,
        details: { note: `Bulk log ${i*BATCH_SIZE+j}` },
        createdAt: new Date(Date.now() - ((i*BATCH_SIZE+j) * 3600000))
      });
    }
    await prisma.auditLog.createMany({ data: logs });
    console.log(`Batched ${i+1}/20`);
  }
  console.log('Done.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
