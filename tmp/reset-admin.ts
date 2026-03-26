import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { email: 'admin@confection-tn.com' },
    data: { passwordHash }
  });
  console.log('Password reset for admin@confection-tn.com to admin123');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
