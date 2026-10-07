import { type NextRequest, NextResponse } from "next/server"
import { authRequired, SESSION_COOKIE, verifySessionToken } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  if (!authRequired()) return NextResponse.next()
  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return Response.json({ error: "Sign in first." }, { status: 401 })
  }
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.search = ""
  const next = request.nextUrl.pathname + request.nextUrl.search
  if (next !== "/") url.searchParams.set("next", next)
  return NextResponse.redirect(url)
}

export const config = {
  // Everything except the login page, Next's static files and the public app icons/manifest.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest).*)"],
}
