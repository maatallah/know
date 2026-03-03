import Link from 'next/link';

export default function NotFound() {
    return (
        <html lang="en">
            <body className="min-h-screen bg-[#fafafa] text-[#1a1a2e] flex items-center justify-center font-sans">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="text-6xl font-bold text-gray-300">404</div>
                    <h2 className="text-xl font-semibold">Page not found</h2>
                    <p className="text-sm text-gray-500 max-w-md">
                        The page you are looking for does not exist or has been moved.
                    </p>
                    <Link
                        href="/"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </body>
        </html>
    );
}
