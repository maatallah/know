import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const isPublicStatic = pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js)$/) || pathname.startsWith('/_next') || pathname === '/favicon.ico';

    // API Routes bypass i18n completely
    if (pathname.startsWith('/api/')) {
        // NextAuth endpoints must be public
        if (pathname.startsWith('/api/auth/')) {
            return NextResponse.next();
        }

        // All other APIs require authentication
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.next();
    }

    // UI Routes security
    const isPublicUI = pathname.match(/^\/(ar|fr|en)\/(login|register)/) || pathname === '/login' || pathname === '/register';

    if (!isPublicStatic && !isPublicUI) {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
            const localeMatch = pathname.match(/^\/(ar|fr|en)/);
            const locale = localeMatch ? localeMatch[1] : 'en';
            const url = req.nextUrl.clone();
            url.pathname = `/${locale}/login`;
            return NextResponse.redirect(url);
        }
    }

    // Handle i18n routing for UI requests
    return intlMiddleware(req);
}

export const config = {
    matcher: ['/', '/(ar|fr|en)/:path*', '/api/:path*'],
};
