import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public paths yang tidak perlu auth
  const publicPaths = ["/", "/claim", "/verify"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Path untuk admin login
  const isAuthPath = pathname.startsWith("/admin/login");

  // Path admin yang perlu proteksi
  const isAdminPath = pathname.startsWith("/admin") && !isAuthPath;

  // Jika sudah login dan mencoba akses login page, redirect ke dashboard
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Jika belum login dan mencoba akses admin path, redirect ke login
  if (!token && isAdminPath) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
