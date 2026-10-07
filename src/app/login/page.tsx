import { redirect } from "next/navigation"
import { Logo } from "@/components/logo"
import { authConfigured, authRequired, safeNext } from "@/lib/auth"
import { LoginForm } from "./login-form"

export const metadata = { title: "Sign in · Studio OS" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams
  if (!authRequired()) redirect("/")

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">One password, then you&apos;re in for 30 days.</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          {authConfigured() ? (
            <LoginForm next={safeNext(next)} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Login isn&apos;t set up yet. Add <code className="rounded bg-muted px-1">APP_PASSWORD</code> and{" "}
              <code className="rounded bg-muted px-1">AUTH_SECRET</code> in Vercel → Settings → Environment Variables, then redeploy.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
