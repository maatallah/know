import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.auditLog.count().then(c => console.log('TOTAL LOGS:', c)).finally(() => prisma.$disconnect());
