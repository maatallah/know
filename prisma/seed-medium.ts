import { PrismaClient, Role, KnowledgeType, RiskLevel, CriticalityLevel, KnowledgeStatus, GapRequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧵 Starting Medium Dataset Generation: Sewing Clothes Factory...');

  // 1. DATA CLEARING (PRESERVE ADMIN)
  console.log('🧹 Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.knowledgeGapRequest.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.knowledgeVersion.deleteMany();
  await prisma.knowledgeItem.deleteMany();
  await prisma.machine.deleteMany();
  
  // Delete all users except admin
  await prisma.user.deleteMany({
    where: { NOT: { email: 'admin@confection-tn.com' } }
  });
  await prisma.department.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. DEPARTMENTS (8)
  console.log('🏢 Creating Departments...');
  const depts = [
    { name: 'Design & Patterns', desc: 'Creation of styles and technical patterns.' },
    { name: 'Cutting Room', desc: 'Fabric spreading and precision cutting.' },
    { name: 'Sewing Line A (Shirts)', desc: 'Mass production of men and women shirts.' },
    { name: 'Sewing Line B (Trousers)', desc: 'Mass production of casual and formal trousers.' },
    { name: 'Quality Assurance', desc: 'Final inspection and AQL audits.' },
    { name: 'Finishing & Packing', desc: 'Ironing, folding, and final packaging.' },
    { name: 'Maintenance', desc: 'Technical support for the machine fleet.' },
    { name: 'Human Resources', desc: 'Staff management and safety training.' }
  ];

  const createdDepts = [];
  for (const d of depts) {
    createdDepts.push(await prisma.department.create({
      data: { name: d.name, description: d.desc }
    }));
  }

  const [designDept, cuttingDept, sewingADept, sewingBDept, qaDept, finishingDept, maintenanceDept, hrDept] = createdDepts;

  // 3. USERS (20 total)
  console.log('👥 Creating Users...');
  // Update/Ensure admin exists
  const admin = await prisma.user.upsert({
    where: { email: 'admin@confection-tn.com' },
    update: { name: 'Factory Director', role: Role.SUPER_ADMIN },
    create: { email: 'admin@confection-tn.com', name: 'Factory Director', role: Role.SUPER_ADMIN, passwordHash, theme: "system", locale: "en" }
  });

  const managers = [
    { email: 'm.design@factory.com', name: 'Zied (Design Manager)', dept: designDept.id },
    { email: 'm.cutting@factory.com', name: 'Ahmed (Cutting Chief)', dept: cuttingDept.id },
    { email: 'm.sewingA@factory.com', name: 'Leila (Line A Chief)', dept: sewingADept.id },
    { email: 'm.sewingB@factory.com', name: 'Kamel (Line B Chief)', dept: sewingBDept.id },
    { email: 'm.qa@factory.com', name: 'Rania (QA Manager)', dept: qaDept.id },
    { email: 'm.finishing@factory.com', name: 'Mounir (Packing Chief)', dept: finishingDept.id },
    { email: 'm.maint@factory.com', name: 'Sami (Technical Director)', dept: maintenanceDept.id }
  ];

  const createdManagers = [];
  for (const m of managers) {
    createdManagers.push(await prisma.user.create({
      data: { email: m.email, name: m.name, role: Role.DEPARTMENT_MANAGER, departmentId: m.dept, passwordHash, locale: "fr" }
    }));
  }

  const experts = [
    { email: 'e.pattern@factory.com', name: 'Sonia (Senior Pattern)', dept: designDept.id },
    { email: 'e.maint1@factory.com', name: 'Hatem (Senior Mechanic)', dept: maintenanceDept.id },
    { email: 'e.maint2@factory.com', name: 'Bechir (Electrician)', dept: maintenanceDept.id },
    { email: 'e.sewing@factory.com', name: 'Nawel (Method Expert)', dept: sewingADept.id },
    { email: 'e.cutting@factory.com', name: 'Tarek (Marker Expert)', dept: cuttingDept.id }
  ];

  const createdExperts = [];
  for (const e of experts) {
    createdExperts.push(await prisma.user.create({
      data: { email: e.email, name: e.name, role: Role.EXPERT, departmentId: e.dept, passwordHash, locale: "en" }
    }));
  }

  const reviewers = [
    { email: 'r.qa1@factory.com', name: 'Ines (QC Auditor)', dept: qaDept.id },
    { email: 'r.qa2@factory.com', name: 'Yosra (Final Inspector)', dept: qaDept.id }
  ];
  const createdReviewers = [];
  for (const r of reviewers) {
    createdReviewers.push(await prisma.user.create({
      data: { email: r.email, name: r.name, role: Role.REVIEWER, departmentId: r.dept, passwordHash, locale: "fr" }
    }));
  }

  const standards = [
    { email: 'u1@factory.com', name: 'Fatma (Operator)', dept: sewingADept.id, locale: "ar" },
    { email: 'u2@factory.com', name: 'Amel (Operator)', dept: sewingADept.id, locale: "ar" },
    { email: 'u3@factory.com', name: 'Mariem (Operator)', dept: sewingBDept.id, locale: "ar" },
    { email: 'u4@factory.com', name: 'Karim (Packer)', dept: finishingDept.id, locale: "fr" },
    { email: 'u5@factory.com', name: 'Saber (Cutter)', dept: cuttingDept.id, locale: "fr" }
  ];
  const createdStandards = [];
  for (const s of standards) {
    createdStandards.push(await prisma.user.create({
      data: { email: s.email, name: s.name, role: Role.STANDARD_USER, departmentId: s.dept, passwordHash, locale: s.locale }
    }));
  }

  // 4. MACHINES (20 total)
  console.log('🤖 Creating Machines...');
  const machineTemplates = [
    { name: 'Juki DDL-8700 Single Needle', prefix: 'JUK-SN', dept: sewingADept.id, count: 5 },
    { name: 'Pegasus Overlock 4-Thread', prefix: 'PEG-OL4', dept: sewingADept.id, count: 3 },
    { name: 'Brother Buttonhole HE-800', prefix: 'BRO-BH', dept: finishingDept.id, count: 2 },
    { name: 'Lectra Vector Cutting Automate', prefix: 'LEC-VEC', dept: cuttingDept.id, count: 1 },
    { name: 'Yamato Interlock Machine', prefix: 'YAM-INT', dept: sewingBDept.id, count: 3 },
    { name: 'Bar Tack Machine Sunstar', prefix: 'SUN-BT', dept: sewingADept.id, count: 2 },
    { name: 'Steam Press Hoffman', prefix: 'HOF-SP', dept: finishingDept.id, count: 2 },
    { name: 'Band Knife Cutting Machine', prefix: 'BK-01', dept: cuttingDept.id, count: 2 }
  ];

  const createdMachines = [];
  for (const t of machineTemplates) {
    for (let i = 1; i <= t.count; i++) {
        createdMachines.push(await prisma.machine.create({
            data: { 
                name: `${t.name} #${i}`, 
                serialNumber: `${t.prefix}-${1000 + i + createdMachines.length}`, 
                departmentId: t.dept 
            }
        }));
    }
  }

  // 5. KNOWLEDGE ITEMS & VERSIONS (40 items, 80 versions)
  console.log('📚 Creating Knowledge Base...');
  const types = Object.values(KnowledgeType);
  const statuses = Object.values(KnowledgeStatus);
  const risks = Object.values(RiskLevel);
  const criticalities = Object.values(CriticalityLevel);

  const jukiMachine = createdMachines.find(m => m.name.includes('Juki'));
  const lectraMachine = createdMachines.find(m => m.name.includes('Lectra'));

  for (let i = 1; i <= 40; i++) {
    const status = i <= 30 ? KnowledgeStatus.APPROVED : (i <= 35 ? KnowledgeStatus.IN_REVIEW : KnowledgeStatus.DRAFT);
    const dept = createdDepts[i % createdDepts.length];
    const owner = createdExperts[i % createdExperts.length] || createdManagers[0];
    
    // Some logic for titles
    let title = `Instruction ${i}`;
    let machineId = null;
    if (i % 3 === 0) {
        title = `Maintenance: ${createdMachines[i % createdMachines.length].name}`;
        machineId = createdMachines[i % createdMachines.length].id;
    } else if (i % 5 === 0) {
        title = `Safety: ${dept.name} Guidelines`;
    } else if (i % 2 === 0) {
        title = `Step-by-Step: ${dept.name} Standard Operation #${i}`;
    }

    const item = await prisma.knowledgeItem.create({
      data: {
        title: title,
        shortDescription: `Automatic generated description for ${title}. Realistic industrial procedure for sewing factory context.`,
        type: types[i % types.length],
        status: status,
        riskLevel: risks[i % risks.length],
        criticalityLevel: criticalities[i % criticalities.length],
        departmentId: dept.id,
        ownerId: owner.id,
        machineId: machineId,
        viewCount: Math.floor(Math.random() * 500),
        healthScore: 80 + Math.floor(Math.random() * 20)
      }
    });

    // Versions
    for (let v = 1; v <= (i % 3 === 0 ? 3 : 1); v++) {
        await prisma.knowledgeVersion.create({
            data: {
                knowledgeItemId: item.id,
                versionNumber: v,
                content: `This is the content for version ${v} of ${title}. It contains detailed steps, safety warnings, and troubleshooting tips for the sewing floor.`,
                authorId: owner.id,
                status: v === (i % 3 === 0 ? 3 : 1) ? status : KnowledgeStatus.ARCHIVED,
                reviewerId: createdReviewers[0].id
            }
        });
    }

    // Attachments (Randomly for some items)
    if (i === 1) { // Juki Threading
        await prisma.attachment.create({
            data: {
                knowledgeItemId: item.id,
                fileName: 'juki_threading.png',
                fileUrl: '/media/seed/juki_threading.png',
                fileType: 'image/png',
                fileSize: 1024 * 500
            }
        });
    }
    if (i === 5) { // Cutting Safety
        await prisma.attachment.create({
            data: {
                knowledgeItemId: item.id,
                fileName: 'cutting_safety.png',
                fileUrl: '/media/seed/cutting_safety.png',
                fileType: 'image/png',
                fileSize: 1024 * 800
            }
        });
    }
    if (i === 10) { // QA visual
        await prisma.attachment.create({
            data: {
                knowledgeItemId: item.id,
                fileName: 'qc_checklist.png',
                fileUrl: '/media/seed/qc_checklist.png',
                fileType: 'image/png',
                fileSize: 1024 * 600
            }
        });
    }
    if (i % 10 === 0) {
        await prisma.attachment.create({
            data: {
                knowledgeItemId: item.id,
                fileName: 'maintenance_schedule.png',
                fileUrl: '/media/seed/maintenance_schedule.png',
                fileType: 'image/png',
                fileSize: 1024 * 450
            }
        });
        // Add a mock video link
        await prisma.attachment.create({
            data: {
                knowledgeItemId: item.id,
                fileName: 'tutorial_video.mp4',
                fileUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
                fileType: 'video/mp4',
                fileSize: 1024 * 1024 * 25
            }
        });
    }
  }

  // 6. GAP REQUESTS (10)
  console.log('📬 Creating Gap Requests...');
  for (let i = 1; i <= 10; i++) {
      const reporter = createdStandards[i % createdStandards.length];
      const status = i <= 4 ? GapRequestStatus.OPEN : (i <= 7 ? GapRequestStatus.ASSIGNED : GapRequestStatus.CLOSED);
      await prisma.knowledgeGapRequest.create({
          data: {
              title: `Gap Request #${i}: Missing info for ${createdMachines[i % createdMachines.length].name}`,
              description: `Operations teams reported a lack of documentation specifically for this machine when handling delicate silk fabrics. Requesting a new procedure ASAP.`,
              reporterId: reporter.id,
              status: status,
              assigneeId: status !== GapRequestStatus.OPEN ? createdExperts[0].id : null
          }
      });
  }

  // 7. AUDIT LOGS (50)
  console.log('📝 Creating Audit Logs...');
  for (let i = 1; i <= 50; i++) {
      await prisma.auditLog.create({
          data: {
              action: i % 2 === 0 ? 'CREATE' : 'UPDATE',
              entityType: i % 3 === 0 ? 'KnowledgeItem' : (i % 2 === 0 ? 'Machine' : 'User'),
              entityId: 'cuid-placeholder',
              userId: createdManagers[0].id,
              details: { note: `Bulk log ${i}`, timestamp: new Date().toISOString() }
          }
      });
  }

  console.log('🚀 SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`Summary:
    - Departments: ${createdDepts.length}
    - Users: ${await prisma.user.count()} (Preserved: admin@confection-tn.com)
    - Machines: ${createdMachines.length}
    - Knowledge items: 40
    - Versions: ${await prisma.knowledgeVersion.count()}
    - Attachments: ${await prisma.attachment.count()}
    - Gap requests: 10
    - Audit logs: 50
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
