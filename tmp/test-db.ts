import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
    try {
        const settings = await prisma.systemSetting.findMany();
        console.log('Settings found:', settings);
    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
