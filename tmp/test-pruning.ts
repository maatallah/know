import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const maxAgeDays = 90;
  const keepOnlyLatest = 1;
  
  console.log(`Pruning with maxAgeDays=${maxAgeDays}, keepOnlyLatest=${keepOnlyLatest}`);
  
  const totalCount = await prisma.auditLog.count();
  console.log('Total logs:', totalCount);
  
  const logsToPrune: string[] = [];
  
  // 1. Age
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  const oldLogs = await prisma.auditLog.findMany({
    where: { createdAt: { lt: cutoffDate } },
    select: { id: true }
  });
  oldLogs.forEach(l => logsToPrune.push(l.id));
  console.log('Old logs identified:', oldLogs.length);

  // 2. Count
  if (totalCount > keepOnlyLatest) {
    const takeAmount = Math.max(0, totalCount - keepOnlyLatest - logsToPrune.length);
    console.log('Extra logs to identify for count limit:', takeAmount);
    const excessLogs = await prisma.auditLog.findMany({
      where: { id: { notIn: logsToPrune } },
      orderBy: { createdAt: 'asc' },
      take: takeAmount,
      select: { id: true }
    });
    excessLogs.forEach(l => logsToPrune.push(l.id));
    console.log('Excess logs identified:', excessLogs.length);
  }

  console.log('Total IDs to prune:', logsToPrune.length);
  
  if (logsToPrune.length === 0) {
    console.log('Nothing to prune.');
    return;
  }

  // Archiving...
  const fullLogs = await prisma.auditLog.findMany({
    where: { id: { in: logsToPrune } },
    include: { user: { select: { name: true, email: true } } }
  });
  
  const archiveDir = path.join(process.cwd(), 'public', 'archives', 'audit');
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
  
  const fileName = `test_archive_${Date.now()}.json`;
  const filePath = path.join(archiveDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(fullLogs, null, 2));
  console.log('Archived to:', filePath);

  const deleteResult = await prisma.auditLog.deleteMany({
    where: { id: { in: logsToPrune } }
  });
  console.log('Deleted:', deleteResult.count);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
