import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  const privatePaths = ["/dashboard", "/profile"];

  const isPrivate = privatePaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isPrivate && !token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
