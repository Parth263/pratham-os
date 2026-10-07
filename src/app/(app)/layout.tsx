import { AppShell } from "@/components/shell/app-shell"
import { authRequired } from "@/lib/auth"

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell authEnabled={authRequired()}>{children}</AppShell>
}
