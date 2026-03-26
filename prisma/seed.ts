import { PrismaClient, Role, KnowledgeType, RiskLevel, CriticalityLevel, KnowledgeStatus, GapRequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧵 Démarrage de la simulation : Usine de Confection Textile (Tunisie)...');

  // Nettoyage de la base de données existante
  await prisma.auditLog.deleteMany();
  await prisma.knowledgeGapRequest.deleteMany();
  await prisma.knowledgeVersion.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.knowledgeItem.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // ==========================================
  // 1. DÉPARTEMENTS
  // ==========================================
  const coupeDept = await prisma.department.create({
    data: { name: 'Atelier de Coupe', description: 'Section responsable du matelassage et de la coupe des rouleaux de tissu.' }
  });
  const piquageDept = await prisma.department.create({
    data: { name: 'Atelier de Piquage (Couture)', description: 'Chaine de montage principale, assemblage des vêtements.' }
  });
  const finitionDept = await prisma.department.create({
    data: { name: 'Finition & Repassage', description: 'Nettoyage des fils, repassage final et emballage.' }
  });
  const qualiteDept = await prisma.department.create({
    data: { name: 'Contrôle Qualité', description: 'Vérification des normes, audits en cours de production (AQL).' }
  });
  const maintenanceDept = await prisma.department.create({
    data: { name: 'Maintenance Industrielle', description: 'Entretien préventif et curatif du parc machine.' }
  });

  // ==========================================
  // 2. UTILISATEURS (Profils réalistes)
  // ==========================================
  const admin = await prisma.user.create({
    data: { email: 'admin@confection-tn.com', name: 'Directeur Général', role: Role.SUPER_ADMIN, passwordHash, theme: "system", locale: "fr" }
  });
  const managerPiquage = await prisma.user.create({
    data: { email: 'chef.piquage@confection-tn.com', name: 'Mme. Samira (Chef d\'Atelier)', role: Role.DEPARTMENT_MANAGER, departmentId: piquageDept.id, passwordHash, theme: "light", locale: "fr" }
  });
  const expertMaintenance = await prisma.user.create({
    data: { email: 'technicien@confection-tn.com', name: 'M. Ali (Chef Mécano)', role: Role.EXPERT, departmentId: maintenanceDept.id, passwordHash, theme: "dark", locale: "fr" }
  });
  const controleurOuled = await prisma.user.create({
    data: { email: 'qualite@confection-tn.com', name: 'Mlle. Rania (CQ)', role: Role.REVIEWER, departmentId: qualiteDept.id, passwordHash, theme: "system", locale: "fr" }
  });
  const ouvriere = await prisma.user.create({
    data: { email: 'ouvriere1@confection-tn.com', name: 'Fatma (Piqueuse)', role: Role.STANDARD_USER, departmentId: piquageDept.id, passwordHash, theme: "light", locale: "ar" }
  });

  // ==========================================
  // 3. MACHINES (Parc textile classique)
  // ==========================================
  const piqueusePlate = await prisma.machine.create({
    data: { name: 'Piqueuse Plate Juki DDL-8700', serialNumber: 'JUK-8700-112', departmentId: piquageDept.id }
  });
  const surjeteuse = await prisma.machine.create({
    data: { name: 'Surjeteuse 4 Fils Pegasus', serialNumber: 'PEG-EX5214-04', departmentId: piquageDept.id }
  });
  const automateCoupe = await prisma.machine.create({
    data: { name: 'Automate de Coupe Lectra Vector', serialNumber: 'LEC-VEC-001', departmentId: coupeDept.id }
  });
  const boutonniere = await prisma.machine.create({
    data: { name: 'Machine à Boutonnière Brother', serialNumber: 'BRO-HE800-44', departmentId: finitionDept.id }
  });

  // ==========================================
  // 4. BASE DE CONNAISSANCES (Scénarios réels)
  // ==========================================

  // A. Statut: APPROVED (Actif et utilisé)
  const itemApproved = await prisma.knowledgeItem.create({
    data: {
      title: 'Procédure d\'enfilage : Surjeteuse Pegasus',
      shortDescription: 'Guide d\'enfilage avec code couleur.',
      type: KnowledgeType.MACHINE_PROCEDURE,
      machineId: surjeteuse.id,
      departmentId: piquageDept.id,
      ownerId: expertMaintenance.id,
      status: KnowledgeStatus.APPROVED,
      riskLevel: RiskLevel.LOW,
      criticalityLevel: CriticalityLevel.MEDIUM,
      viewCount: 145,
      expiryDate: new Date('2027-01-01'),
      isDeleted: false
    }
  });
  await prisma.knowledgeVersion.create({
    data: {
      knowledgeItemId: itemApproved.id,
      versionNumber: 1,
      content: '1. Couper l\'alimentation électrique.\n2. Passer le fil du boucleur inférieur (vert).\n3. Passer le fil du boucleur supérieur (rouge).\n4. Enfiler l\'aiguille droite puis gauche.\n**Attention**: Tension de fil recommandée : 3.5.',
      authorId: expertMaintenance.id,
      reviewerId: controleurOuled.id,
      status: KnowledgeStatus.APPROVED
    }
  });

  // B. Statut: IN_REVIEW (En attente de validation Qualité)
  const itemInReview = await prisma.knowledgeItem.create({
    data: {
      title: 'Consignes de sécurité : Lame Automate Lectra',
      shortDescription: 'Port des gants obligatoire (LOTO).',
      type: KnowledgeType.SAFETY_INSTRUCTION,
      machineId: automateCoupe.id,
      departmentId: coupeDept.id,
      ownerId: managerPiquage.id,
      status: KnowledgeStatus.IN_REVIEW,
      riskLevel: RiskLevel.HIGH,
      criticalityLevel: CriticalityLevel.HIGH,
      viewCount: 2,
      isDeleted: false
    }
  });
  await prisma.knowledgeVersion.create({
    data: {
      knowledgeItemId: itemInReview.id,
      versionNumber: 1,
      content: 'Avant toute intervention sur la tête de coupe, le port des gants en cotte de mailles est **OBLIGATOIRE**. Verrouiller le sectionneur principal (LOTO).',
      authorId: managerPiquage.id,
      status: KnowledgeStatus.IN_REVIEW
    }
  });

  // C. Statut: DRAFT (Brouillon en cours de rédaction)
  const itemDraft = await prisma.knowledgeItem.create({
    data: {
      title: 'Guide de réglage : Tension point noué (Juki)',
      shortDescription: 'En cours de rédaction.',
      type: KnowledgeType.TROUBLESHOOTING,
      machineId: piqueusePlate.id,
      departmentId: piquageDept.id,
      ownerId: expertMaintenance.id,
      status: KnowledgeStatus.DRAFT,
      riskLevel: RiskLevel.LOW,
      criticalityLevel: CriticalityLevel.MEDIUM,
      viewCount: 0,
      isDeleted: false
    }
  });
  await prisma.knowledgeVersion.create({
    data: {
      knowledgeItemId: itemDraft.id,
      versionNumber: 1,
      content: 'En cours de rédaction. Prendre des photos de la molette de tension...',
      authorId: expertMaintenance.id,
      status: KnowledgeStatus.DRAFT
    }
  });

  // D. Statut: ARCHIVED (Ancienne norme)
  const itemArchived = await prisma.knowledgeItem.create({
    data: {
      title: 'Ancien Manuel d\'emballage (2023)',
      shortDescription: 'Ancienne norme client.',
      type: KnowledgeType.WORK_INSTRUCTION,
      departmentId: finitionDept.id,
      ownerId: managerPiquage.id,
      status: KnowledgeStatus.ARCHIVED,
      riskLevel: RiskLevel.LOW,
      criticalityLevel: CriticalityLevel.LOW,
      viewCount: 412,
      isDeleted: false
    }
  });
  await prisma.knowledgeVersion.create({
    data: {
      knowledgeItemId: itemArchived.id,
      versionNumber: 1,
      content: 'Ceci est l\'ancienne norme client. Remplacée par la norme ISO 2024.',
      authorId: managerPiquage.id,
      reviewerId: controleurOuled.id,
      status: KnowledgeStatus.ARCHIVED
    }
  });

  // E. Expiration Proche (Alerte d'audit)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const itemExpiring = await prisma.knowledgeItem.create({
    data: {
      title: 'Gamme de montage : Chemise Homme M24',
      shortDescription: 'Temps alloué: 14.5 minutes.',
      type: KnowledgeType.WORK_INSTRUCTION,
      departmentId: piquageDept.id,
      ownerId: managerPiquage.id,
      status: KnowledgeStatus.APPROVED,
      riskLevel: RiskLevel.LOW,
      criticalityLevel: CriticalityLevel.HIGH,
      viewCount: 89,
      expiryDate: nextWeek,
      isDeleted: false
    }
  });
  await prisma.knowledgeVersion.create({
    data: {
      knowledgeItemId: itemExpiring.id,
      versionNumber: 1,
      content: 'Montage col, poignets, plaquage poche. \nAssembler le devant avec le dos.',
      authorId: managerPiquage.id,
      reviewerId: controleurOuled.id,
      status: KnowledgeStatus.APPROVED
    }
  });

  // ==========================================
  // 5. DEMANDES DE LACUNES (Knowledge Gaps)
  // ==========================================
  await prisma.knowledgeGapRequest.create({
    data: {
      title: 'Problème de casse d\'aiguille récurrent sur Brother HE-800',
      description: 'Sur le tissu Denim lourd, les aiguilles cassent au passage de l\'ourlet. Pouvons-nous avoir un guide de dépannage spécifique pour les tissus épais ?',
      reporterId: ouvriere.id, // Demandé par l'ouvrière
      status: GapRequestStatus.OPEN
    }
  });

  await prisma.knowledgeGapRequest.create({
    data: {
      title: 'Traduction en Arabe du manuel Lectra',
      description: 'Les nouveaux opérateurs ne comprennent pas les erreurs affichées en Français sur l\'automate de coupe.',
      reporterId: controleurOuled.id,
      status: GapRequestStatus.ASSIGNED, // Déjà pris en charge
      assigneeId: expertMaintenance.id
    }
  });

  console.log('✅ Base de données initialisée avec succès (Contexte Textile Tunisie) !');
  console.log('Comptes disponibles:');
  console.log('- admin@confection-tn.com (Super Admin)');
  console.log('- chef.piquage@confection-tn.com (Manager)');
  console.log('- technicien@confection-tn.com (Expert)');
  console.log('- qualite@confection-tn.com (Reviewer)');
  console.log('- ouvriere1@confection-tn.com (Standard)');
  console.log('Mot de passe pour tous : password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
