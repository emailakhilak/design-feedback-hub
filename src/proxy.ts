import { NextResponse } from 'next/server';

/**
 * Next.js proxy route handler.
 * Supabase has been removed. Browser Local Storage handles application persistence.
 * For demo navigation protection, cookies can optionally be inspected,
 * or requests pass through safely to the client-side demo guard.
 */
export async function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svg, icons
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
