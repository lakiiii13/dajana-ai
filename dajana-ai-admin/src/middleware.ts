import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const session = request.cookies.get("admin_session");
    if (!session?.value || !session.value.includes(".")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const session = request.cookies.get("admin_session");
    if (!session?.value || !session.value.includes(".")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json(
              { error: "CSRF rejected" },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            { error: "CSRF rejected" },
            { status: 403 }
          );
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
