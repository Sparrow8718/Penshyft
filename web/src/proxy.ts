import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";
import { createProxyClient } from "@/lib/db/auth-proxy";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password", "/auth"];

function isPublicPath(pathnameWithoutLocale: string) {
  return PUBLIC_PATHS.some(
    (p) => pathnameWithoutLocale === p || pathnameWithoutLocale.startsWith(p + "/"),
  );
}

export default async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(/^\/(en|fr|es|pt)(\/|$)/);

  if (!localeMatch) return intlResponse;

  const locale = localeMatch[1];
  const pathAfterLocale = pathname.slice(locale.length + 1) || "/";

  if (pathname.startsWith(`/${locale}/dev/`) || isPublicPath(pathAfterLocale)) {
    return intlResponse;
  }

  const response = intlResponse ?? NextResponse.next();
  const supabase = createProxyClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isPublicPath(pathAfterLocale) && pathAfterLocale !== "/") {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|dev|favicon.ico|.*\\..*).*)"],
};
