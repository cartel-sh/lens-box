import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCookieAuth } from "./utils/getCookieAuth";

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  const { isValid: isAuthTokenValid } = getCookieAuth();

  // Redirect from pingpad.io to lens.box
  if (hostname === "pingpad.io" || hostname === "www.pingpad.io") {
    const newUrl = new URL(request.url);
    newUrl.hostname = "lens.box";
    return NextResponse.redirect(newUrl, { status: 301 });
  }

  // Check for the .lens postfix
  const lensNamespace = /^\/u\/(.+)\.lens$/;
  const postfixMatch = pathname.match(lensNamespace);
  if (postfixMatch) {
    const username = postfixMatch[1];
    return NextResponse.redirect(new URL(`/u/${username}`, request.url));
  }

  // Check for the lens namespace
  const oldLensNamespace = /^\/u\/lens\/(.+)$/;
  const namespaceMatch = pathname.match(oldLensNamespace);
  if (namespaceMatch) {
    const username = namespaceMatch[1];
    return NextResponse.redirect(new URL(`/u/${username}`, request.url));
  }

  if (isAuthTokenValid && pathname === "/") {
    // If authenticated redirect the / to /home
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Routes that are always accessible
  const publicRoutes = ["/", "/home", "/u", "/p", "/login", "/register"];

  if (!isAuthTokenValid) {
    if (!publicRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|logo.png|home|favicon.ico).*)"],
};
