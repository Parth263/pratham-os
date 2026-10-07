"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { authConfigured, checkPassword, createSessionToken, safeNext, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth"

export interface LoginState {
  error: string | null
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!authConfigured()) {
    return { error: "Login isn't set up yet. Add APP_PASSWORD and AUTH_SECRET in Vercel → Settings → Environment Variables, then redeploy." }
  }
  if (!checkPassword(String(formData.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 600)) // slow down guessing
    return { error: "That's not it. Try again." }
  }
  ;(await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  redirect(safeNext(formData.get("next")))
}

export async function logout() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect("/login")
}
