import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication for write operations
const protectedApiRoutes = [
    { path: '/api/knowledge', methods: ['POST', 'PUT', 'DELETE'] },
    { path: '/api/knowledge/', methods: ['POST', 'PUT', 'DELETE'] },
];

export default async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Handle API route protection
    if (pathname.startsWith('/api/')) {
        // Skip auth check for GET requests and auth routes
        if (req.method === 'GET' || pathname.startsWith('/api/auth/')) {
            return NextResponse.next();
        }

        // All non-GET API calls require authentication
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.next();
    }

    // Handle i18n routing for all other requests
    return intlMiddleware(req);
}

export const config = {
    matcher: ['/', '/(ar|fr|en)/:path*', '/api/:path*'],
};
