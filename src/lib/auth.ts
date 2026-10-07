import { createHash, timingSafeEqual } from "node:crypto"
import { jwtVerify, SignJWT } from "jose"

export const SESSION_COOKIE = "studio_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const sha256 = (s: string) => createHash("sha256").update(s).digest()

function secretKey(): Uint8Array | null {
  const s = process.env.AUTH_SECRET
  return s && s.length >= 32 ? new TextEncoder().encode(s) : null
}

/** Both env vars are set and usable. */
export function authConfigured(): boolean {
  return !!process.env.APP_PASSWORD && !!secretKey()
}

/** In production login is always required; in development only once it's configured. */
export function authRequired(): boolean {
  return authConfigured() || process.env.NODE_ENV === "production"
}

/** Ties sessions to the current password, so changing APP_PASSWORD signs every device out. */
function passwordTag(): string {
  return sha256(`studio-os:${process.env.APP_PASSWORD ?? ""}`).toString("base64url").slice(0, 16)
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD
  if (!expected) return false
  return timingSafeEqual(sha256(input), sha256(expected))
}

export async function createSessionToken(): Promise<string> {
  const key = secretKey()
  if (!key) throw new Error("AUTH_SECRET is missing or shorter than 32 characters")
  return new SignJWT({ pw: passwordTag() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("owner")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key)
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const key = secretKey()
  if (!token || !key) return false
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"], subject: "owner" })
    return payload.pw === passwordTag()
  } catch {
    return false
  }
}

/** Only same-site paths, so ?next= can't send you somewhere else. */
export function safeNext(next: unknown): string {
  const s = typeof next === "string" ? next : ""
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") && !s.startsWith("/login") ? s : "/"
}
