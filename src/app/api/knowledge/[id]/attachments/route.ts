import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

// GET — List attachments for a knowledge item
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const attachments = await prisma.attachment.findMany({
        where: { knowledgeItemId: id },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(attachments);
}

// POST — Upload file to a knowledge item
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify knowledge item exists
    const item = await prisma.knowledgeItem.findUnique({ where: { id } });
    if (!item) {
        return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File size exceeds 300MB limit' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const ext = file.name.split('.').pop() || '';
    const storedName = `${randomUUID()}.${ext}`;
    const filePath = join(UPLOAD_DIR, storedName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Determine file type
    const mimeType = file.type || 'application/octet-stream';
    let fileType = 'OTHER';
    if (mimeType.startsWith('image/')) fileType = 'IMAGE';
    else if (mimeType.startsWith('video/')) fileType = 'VIDEO';
    else if (mimeType.startsWith('audio/')) fileType = 'AUDIO';
    else if (mimeType === 'application/pdf') fileType = 'PDF';

    // Save to database
    const attachment = await prisma.attachment.create({
        data: {
            knowledgeItemId: id,
            fileName: file.name,
            fileUrl: `/api/attachments/${storedName}`,
            fileType,
            fileSize: file.size,
        },
    });

    return NextResponse.json(attachment, { status: 201 });
}
