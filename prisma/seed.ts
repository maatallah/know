import { PrismaClient, Role, KnowledgeType, RiskLevel, CriticalityLevel, KnowledgeStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Departments
  const maintenanceDept = await prisma.department.upsert({
    where: { name: 'Maintenance' },
    update: {},
    create: {
      name: 'Maintenance',
      description: 'Handles all factory equipment maintenance and repairs.',
    },
  });

  const productionDept = await prisma.department.upsert({
    where: { name: 'Production' },
    update: {},
    create: {
      name: 'Production',
      description: 'Manages assembly lines and manufacturing processes.',
    },
  });

  // 2. Create Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'System Admin',
      role: Role.SUPER_ADMIN,
      passwordHash,
    },
  });

  const expertUser = await prisma.user.upsert({
    where: { email: 'expert@example.com' },
    update: {},
    create: {
      email: 'expert@example.com',
      name: 'Senior Technician',
      role: Role.EXPERT,
      passwordHash,
      departmentId: maintenanceDept.id,
    },
  });

  const reviewerUser = await prisma.user.upsert({
    where: { email: 'reviewer@example.com' },
    update: {},
    create: {
      email: 'reviewer@example.com',
      name: 'Quality Assurance Manager',
      role: Role.REVIEWER,
      passwordHash,
      departmentId: productionDept.id,
    },
  });

  // 3. Create Machines
  const cncMachine = await prisma.machine.upsert({
    where: { serialNumber: 'CNC-2026-001' },
    update: {},
    create: {
      name: '5-Axis CNC Milling Machine',
      serialNumber: 'CNC-2026-001',
      departmentId: productionDept.id,
    },
  });

  // 4. Create Categories
  const safetyCategory = await prisma.category.upsert({
    where: { id: 'cat-safety-001' }, // Note: Using custom ID just for seed predictability if needed
    update: {},
    create: {
      name: 'Safety Guidelines',
    },
  });

  // 5. Create Tags
  const safetyTag = await prisma.tag.upsert({
    where: { name: 'SafetyFirst' },
    update: {},
    create: { name: 'SafetyFirst' },
  });

  // 6. Create Knowledge Item
  const procedureItem = await prisma.knowledgeItem.create({
    data: {
      title: 'Emergency Stop Procedure for CNC Machine',
      shortDescription: 'Steps to safely perform an emergency stop.',
      type: KnowledgeType.SAFETY_INSTRUCTION,
      riskLevel: RiskLevel.HIGH,
      criticalityLevel: CriticalityLevel.HIGH,
      estimatedTimeMin: 5,
      requiredTools: 'None',
      preconditions: 'Machine must be running.',
      expectedOutcome: 'Machine safely halted without damaging the spindle.',
      status: KnowledgeStatus.APPROVED,
      ownerId: expertUser.id,
      departmentId: maintenanceDept.id,
      machineId: cncMachine.id,
      categoryId: safetyCategory.id,
      tags: {
        connect: [{ id: safetyTag.id }],
      },
      effectiveDate: new Date(),
    },
  });

  // 7. Create Knowledge Version
  const procedureVersion = await prisma.knowledgeVersion.create({
    data: {
      knowledgeItemId: procedureItem.id,
      versionNumber: 1,
      content: '# Emergency Stop\\n\\n1. Locate the red E-Stop button.\\n2. Press firmly.\\n3. Log the incident.',
      authorId: expertUser.id,
      reviewerId: reviewerUser.id,
      approvalComment: 'Reviewed and approved for all factory floor operators.',
      status: KnowledgeStatus.APPROVED,
    },
  });

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
