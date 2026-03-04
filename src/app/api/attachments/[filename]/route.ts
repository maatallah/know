import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { requireAuth, isAuthError } from '@/lib/rbac';

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

        // Derive content type from fileType
        const contentTypeMap: Record<string, string> = {
            PDF: 'application/pdf',
            IMAGE: 'image/png',
            VIDEO: 'video/mp4',
            AUDIO: 'audio/mpeg',
        };
        const contentType = contentTypeMap[attachment.fileType] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
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
    const auth = await requireAuth('attachments.delete');
    if (isAuthError(auth)) return auth;

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
