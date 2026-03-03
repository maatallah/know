import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

// GET /api/attachments/[filename] — Download/serve file
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // Find attachment by URL pattern
    const attachment = await prisma.attachment.findFirst({
        where: { fileUrl: `/api/attachments/${filename}` },
    });

    if (!attachment) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
        const filePath = join(UPLOAD_DIR, filename);
        const fileBuffer = await readFile(filePath);

        // Increment download count
        await prisma.attachment.update({
            where: { id: attachment.id },
            data: { downloadCount: { increment: 1 } },
        });

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': attachment.mimeType || 'application/octet-stream',
                'Content-Disposition': `inline; filename="${attachment.fileName}"`,
                'Content-Length': String(fileBuffer.length),
            },
        });
    } catch {
        return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }
}

// DELETE /api/attachments/[filename] — Remove file
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await params;

    const attachment = await prisma.attachment.findFirst({
        where: { fileUrl: `/api/attachments/${filename}` },
    });

    if (!attachment) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from database
    await prisma.attachment.delete({ where: { id: attachment.id } });

    // Delete from disk
    try {
        await unlink(join(UPLOAD_DIR, filename));
    } catch {
        // File might not exist on disk, continue
    }

    return NextResponse.json({ success: true });
}
